import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import config from '../config';

const apiUrl = config.apiUrl;

function SellerDashboard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchSellerItems();
    }, []);

    const fetchSellerItems = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/seller/items`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }

            const data = await response.json();
            setItems(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleShipItem = async (itemId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/seller/sellItem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ itemId })
            });

            if (!response.ok) {
                throw new Error('Failed to ship item');
            }

            setSuccess('Item shipped successfully!');
            // Refresh the items list
            fetchSellerItems();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDenySale = async (itemId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/seller/denySale`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ itemId })
            });

            if (!response.ok) {
                throw new Error('Failed to deny sale');
            }

            setSuccess('Sale denied successfully!');
            // Refresh the items list
            fetchSellerItems();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1:
                return 'Available';
            case 2:
                return 'Reserved';
            case 3:
                return 'Sold';
            default:
                return 'Unknown';
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Seller Dashboard</h2>
                <Link to="/create-item">
                    <Button variant="primary">Create New Item</Button>
                </Link>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td>{item.item}</td>
                            <td>{item.description}</td>
                            <td>${item.price}</td>
                            <td>{getStatusText(item.item_status)}</td>
                            <td>
                                {item.item_status === 2 && (
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleShipItem(item.id)}
                                        >
                                            Ship Item
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDenySale(item.id)}
                                        >
                                            Deny Sale
                                        </Button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}

export default SellerDashboard;
