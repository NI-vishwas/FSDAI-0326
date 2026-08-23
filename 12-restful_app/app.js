const express= require('express');
const app= express();
const port= 3000;

const products = [
    { id: 1, name: 'Product 1', price: 10.99 },
    { id: 2, name: 'Product 2', price: 19.99 },
    { id: 3, name: 'Product 3', price: 5.99 },
]

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/products', (req, res) => {
    const newProduct = req.body;
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get('/products', (req, res) => {
    res.status(200).json(products);
});

app.put('/products/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const product = products.filter(p => p.id === id)

    if(product == null){
        res.status(404).json({error: 'Product not found'})
    }

    const {name, price} = req.body
    product.name = name
    product.price = price

    // Implement logic to insert in the same place as earlier
    //
    res.status(200).json(product);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});