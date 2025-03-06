import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import config from '../config';

const apiUrl = config.apiUrl;

function CreateItem() {
    const [formData, setFormData] = useState({
        item: '',
        description: '',
        price: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/seller/createItem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create item');
            }

            setSuccess(true);
            setFormData({
                item: '',
                description: '',
                price: ''
            });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Create New Item</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">Item created successfully!</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Item Name</Form.Label>
                    <Form.Control
                        type="text"
                        name="item"
                        value={formData.item}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Price ($)</Form.Label>
                    <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                    />
                </Form.Group>

                <Button variant="primary" type="submit">
                    Create Item
                </Button>
            </Form>
        </Container>
    );
}

export default CreateItem;
