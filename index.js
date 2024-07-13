import express from 'express';
import pool from './Config/db.js';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
config();

const secretkey = process.env.SecretKey;
const port = process.env.PORT || 3000; 
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/login', async (req, res) => {
    const { usuario, email, contrasenia } = req.body;

    const query = 'SELECT * FROM usuario WHERE usuario = ? AND email = ? AND contrasenia = ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query, [usuario, email, contrasenia]);
        connection.release();
        if (rows.length > 0) {
            // Firmamos el token
            const user = rows[0]; // Asignamos el primer resultado a `user`
            jwt.sign({ user }, secretkey, { expiresIn: '10m' }, (err, token) => {
                if (err) {
                    console.error('Error in jwt.sign:', err);
                    return res.status(500).send('Error en el servidor');
                }
                res.json({ token });
            });
        } else {
            res.status(401).send('Usuario, correo o contraseña incorrecta');
        }
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Crea un usuario (Registrarse) //Preguntar a facu por el registro
// app.post('/usuario', async (req, res) => {
//     const usuario = req.body;
    
//     const sql = 'INSERT INTO usuario SET ?';
//     try {
//         const connection = await pool.getConnection();
//         const [rows] = await connection.query(sql, [usuario]);
//         connection.release();
//         res.status(201).json(rows);
//     }catch(err){
//         res.status(500).send("Error al conectarse con el servidor");
//     }
// });

// Retornar todos los productos
app.get('/usuario', async (req, res) => {
    const query = 'SELECT * FROM usuario';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        connection.release();
        res.status(200).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

//Retorna las sucursales
app.get('/sucursal', async (req, res) => {
    const query = 'SELECT * FROM sucursal';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        connection.release();
        res.status(200).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Retornar todos los productos (Esto es para dividir cuando se muestren en panchos, snacks, etc)
app.get('/productos/:categoria', async (req, res) => {
    const categoria = req.params.categoria;
    const query = 'SELECT * FROM producto WHERE categoria = ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query, [categoria]);
        connection.release();
        res.status(200).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Retornar todos los productos
app.get('/productos', async (req, res) => {
    const query = 'SELECT * FROM producto';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        connection.release();
        res.status(200).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

app.get('/carrito', async (req, res) => {
    const query = 'SELECT * FROM carrito';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        connection.release();
        res.status(200).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Obtener un carrito particular
app.get('/carrito/:id', async (req, res) => {
    const id = req.params.id; 
    const query = `
SELECT
    carrito.fecha,
    carrito.preciototal,
    usuario.nombre AS nombre_real,
    usuario.apellido,
    usuario.email,
    usuario.documento,
    usuario.usuario AS nombre_usuario,
    sucursal.pais,
    sucursal.calle,
    sucursal.barrio,
    producto.nombre AS nombre_producto,
    producto.precio AS precio_producto,
    producto.descripcion AS descripcion_producto,
    producto.categoria AS categoria_producto
FROM
    carrito
JOIN
    usuario ON carrito.usuario_idusuario = usuario.idusuario
JOIN
    sucursal ON carrito.sucursal_idsucursal = sucursal.idsucursal
JOIN
    carrito_has_producto ON carrito.idcarrito = carrito_has_producto.carrito_idcarrito
JOIN
    producto ON carrito_has_producto.producto_idproducto = producto.idproducto
WHERE
    carrito.idcarrito = ?;
`;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query, id); 
        connection.release();
        
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send('Carrito no encontrado');
        }
    } catch (err) {
        res.status(500).send('Error al conectarse con el servidor');
    }
});

//Crear un producto 
app.post('/producto', async (req, res) => {
    const { precioTotal, usuario_idusuario, sucursal_idsucursal, fecha, productos } = req.body;

    const connection = await pool.getConnection();
    try {
        // Iniciar transacción
        await connection.beginTransaction();

        // Verificar si el usuario existe
        const [userResult] = await connection.query('SELECT 1 FROM usuario WHERE idusuario = ?', [usuario_idusuario]);
        if (userResult.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        // Verificar si la sucursal existe
        const [sucursalResult] = await connection.query('SELECT 1 FROM sucursal WHERE idsucursal = ?', [sucursal_idsucursal]);
        if (sucursalResult.length === 0) {
            throw new Error('Sucursal no encontrada');
        }

        // Paso 1: Insertar el carrito
        const queryCarrito = 'INSERT INTO carrito (fecha, precioTotal, usuario_idusuario, sucursal_idsucursal) VALUES (?, ?, ?, ?)';
        console.log("Punto de corte");
        const [result] = await connection.query(queryCarrito, [fecha, precioTotal, usuario_idusuario, sucursal_idsucursal]);

        console.log("Result", result);
        const carritoId = result.insertId; // Obtener el ID del carrito recién creado

        // Paso 2: Añadir productos al carrito (relación de muchos a muchos)
        const queryCarritoProducto = 'INSERT INTO carrito_has_producto (carrito_idcarrito, producto_idproducto) VALUES ?';
        const carritoProductoValues = productos.map(producto => [carritoId, producto]);
        await connection.query(queryCarritoProducto, [carritoProductoValues]);

        // Confirmar la transacción
        await connection.commit();
        res.status(201).send({ message: 'Carrito y productos creados con éxito', carritoId });
    } catch (err) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error al crear carrito:', err);
        res.status(500).send({ message: 'Error al crear carrito', error: err.message });
    } finally {
        // Liberar la conexión
        connection.release();
    }
});


// Crear un carrito
app.post('/carrito', async (req, res) => {
    const carrito = req.body;
    const sql = 'INSERT INTO carrito SET ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, [carrito]);
        connection.release();
        console.log(rows);
        res.status(201).json(rows);
    }catch(err){
        console.log(err);
        res.status(500).send("Error al conectarse con el servidor");
    }
});

//Crear un producto 
app.post('/sucursal', async (req, res) => {
    const sucursal = req.body;
    
    const sql = 'INSERT INTO sucursal SET ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, [sucursal]);
        connection.release();
        res.status(201).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

//Crear tabla intermedia
app.post('/carrito/producto', async (req, res) => {
    const carrito = req.body;

    const sql = 'INSERT INTO carrito_has_producto SET ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, [carrito]);
        connection.release();
        res.status(201).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Crear un usuario
app.post('/usuario', async (req, res) => {
    const usuario = req.body;
    
    const sql = 'INSERT INTO usuario SET ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, [usuario]);
        connection.release();
        res.status(201).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Actualizar un carrito
app.put('/carrito/:id', async (req, res) => {
    const id = req.params.id;
    const carrito = req.body;
    
    const sql = 'UPDATE carrito SET ? WHERE idcarrito = ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, [carrito, id]);
        connection.release();
        if (rows.affectedRows > 0) {
            res.status(200).json({ message: 'Carrito actualizado exitosamente' });
        } else {
            res.status(404).send('Carrito no encontrado');
        }
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Borrar un producto del carrito
app.delete('/carrito/:id', async (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE from carrito WHERE idcarrito = ?';

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, id);
        connection.release();
        if (rows.affectedRows > 0) {
            res.status(204).send(); 
        } else {
            res.status(404).send('Carrito no encontrado');
        }
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

// Borrar un usuario 
app.delete('/usuario/:id', async (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE from usuario WHERE idusuario = ?';

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, id);
        connection.release();
        if (rows.affectedRows > 0) {
            res.status(204).send(); 
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});


app.listen(port, () => {
console.log(`Example app listening`+
`at http://localhost:${port}`);
});
