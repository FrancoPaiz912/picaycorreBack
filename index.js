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
        res.send(500).send("Error al conectarse con el servidor");
    }
});

// Obtener un carrito particular
app.get('/carrito/:id', async (req, res) => {
    const id = req.params.id; // Obteniendo el id del parámetro de la ruta
    const query = `
    SELECT
    carrito.idcarrito,
    carrito.fecha,
    carrito.preciototal,
    usuario.idusuario,
    usuario.nombre,
    usuario.apellido,
    usuario.email,
    usuario.documento,
    sucursal.idsucursal,
    sucursal.pais,
    sucursal.provincia,
    sucursal.calle,
    sucursal.barrio,
    producto.idproducto,
    producto.nombre AS nombre_producto,
    producto.precio AS precio_producto,
    producto.descripcion AS descripcion_producto
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
app.get('/usuario/:id', async (req, res) => {
    const query = 'SELECT * FROM producto';
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        connection.release();
        res.status(200).json(rows);
    }catch(err){
        res.send(500).send("Error al conectarse con el servidor");
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
        res.status(201).json(rows);
    }catch(err){
        res.send(500).send("Error al conectarse con el servidor");
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
        res.send(500).send("Error al conectarse con el servidor");
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
        res.send(500).send("Error al conectarse con el servidor");
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
        res.send(500).send("Error al conectarse con el servidor");
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
            res.status(404).send('Carrito no encontrado');
        }
    }catch(err){
        res.send(500).send("Error al conectarse con el servidor");
    }
});

app.listen(port, () => {
console.log(`Example app listening`+
`at http://localhost:${port}`);
});
