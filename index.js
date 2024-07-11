import express from 'express';
import pool from './Config/db.js';
import { config } from 'dotenv';

config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000; 

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

// Obtener un carrito particular
app.get('/carrito/:id', async (req, res) => {
    const id = req.params.id; // Obteniendo el id del parámetro de la ruta
    const query = `
SELECT 
    c.idcarrito,
    c.fecha,
    c.precioTotal,
    u.idusuario,
    u.nombre AS usuario_nombre,
    u.apellido AS usuario_apellido,
    u.email AS usuario_email,
    u.documento AS usuario_documento,
    s.idsucursal,
    s.pais AS sucursal_pais,
    s.calle AS sucursal_calle,
    s.barrio AS sucursal_barrio,
    p.idproducto,
    p.nombre AS producto_nombre,
    p.precio AS producto_precio,
    p.descripcion AS producto_descripcion,
    p.categoria AS producto_categoria
FROM 
    carrito c
INNER JOIN 
    usuario u ON c.usuario_idusuario = u.idusuario
INNER JOIN 
    sucursal s ON c.sucursal_idsucursal = s.idsucursal
INNER JOIN 
    carrito_has_producto chp ON c.idcarrito = chp.carrito_idcarrito
INNER JOIN 
    producto p ON chp.producto_idproducto = p.idproducto
WHERE 
    c.idcarrito = ?; 

    `;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query, [id]); 
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

// Retorna un usuario
// app.get('/usuario/:correo/:contrasenia', async (req, res) => {
//     const query = 'SELECT * FROM usuario WHERE email = ? AND contrasenia = ?;'
//     try {
//         const connection = await pool.getConnection();
//         const [rows] = await connection.query(query);
//         connection.release();
//         res.status(200).json(rows);
//     }catch(err){
//         res.status(500).send("Error al conectarse con el servidor");
//     }
// });

// Crear un carrito
app.post('/carrito', async (req, res) => {
    const carrito = req.body;
    
    const sql = 'INSERT INTO carrito SET ?';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(sql, [carrito]);
        connection.release();
        res.status(201).json(rows);
    }catch(err){
        res.status(500).send("Error al conectarse con el servidor");
    }
});

//Crear tabla intermedia
app.post('/carrito/producto', async (req, res) => {
    const carrito = req.body;
    console.log(carrito); // Agrega esta línea para verificar el contenido de req.body

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
