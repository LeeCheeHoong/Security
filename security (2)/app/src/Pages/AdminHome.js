import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Modal } from 'react-bootstrap';
import config from '../config';

const apiUrl = config.apiUrl;

function AdminHome() {
    const [users, setUsers] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [pendingSellers, setPendingSellers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateAdmin, setShowCreateAdmin] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });

    const token = localStorage.getItem('authToken');

    useEffect(() => {
        fetchUsers();
        fetchSellers();
        fetchPendingSellers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${apiUrl}/admin/listUser`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.data);
            }
        } catch (error) {
            setError('Failed to fetch users');
        }
    };

    const fetchSellers = async () => {
        try {
            const response = await fetch(`${apiUrl}/admin/listSeller`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSellers(data.data);
            }
        } catch (error) {
            setError('Failed to fetch sellers');
        }
    };

    const fetchPendingSellers = async () => {
        try {
            const response = await fetch(`${apiUrl}/admin/listUser`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const pending = data.data.filter(user =>
                    user.attributes.includes('PENDING_SELLER')
                );
                setPendingSellers(pending);
            }
        } catch (error) {
            setError('Failed to fetch pending sellers');
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiUrl}/admin/createAdmin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            });

            if (response.ok) {
                setSuccess('Admin created successfully');
                setShowCreateAdmin(false);
                setNewAdmin({ username: '', password: '' });
                fetchUsers();
            } else {
                setError('Failed to create admin');
            }
        } catch (error) {
            setError('Error creating admin');
        }
    };

    const handleRemoveSellerRights = async (sellerName) => {
        if (window.confirm(`Are you sure you want to remove seller rights from ${sellerName}?`)) {
            try {
                const response = await fetch(`${apiUrl}/admin/removeSellerRights`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sellerName })
                });

                if (response.ok) {
                    setSuccess(`Removed seller rights from ${sellerName}`);
                    fetchSellers();
                    fetchUsers();
                } else {
                    setError('Failed to remove seller rights');
                }
            } catch (error) {
                setError('Error removing seller rights');
            }
        }
    };

    const handleApproveSeller = async (sellerName) => {
        try {
            const response = await fetch(`${apiUrl}/admin/approveSeller`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sellerName })
            });

            if (response.ok) {
                setSuccess(`Approved seller: ${sellerName}`);
                fetchUsers();
                fetchSellers();
                fetchPendingSellers();
            } else {
                setError('Failed to approve seller');
            }
        } catch (error) {
            setError('Error approving seller');
        }
    };

    return (
        <Container className="py-5">
            <h1 className="text-center mb-5">Admin Dashboard</h1>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-warning text-white">
                            <h3 className="mb-0">Pending Seller Applications</h3>
                        </Card.Header>
                        <Card.Body>
                            {pendingSellers.length === 0 ? (
                                <p className="text-center text-muted my-3">No pending applications</p>
                            ) : (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Current Roles</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingSellers.map((seller, index) => (
                                            <tr key={index}>
                                                <td>{seller.username}</td>
                                                <td>{seller.attributes.join(', ')}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleApproveSeller(seller.username)}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
                            <h3 className="mb-0">System Users</h3>
                            <Button variant="light" onClick={() => setShowCreateAdmin(true)}>
                                Create Admin
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Roles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={index}>
                                            <td>{user.username}</td>
                                            <td>{user.attributes.join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-success text-white">
                            <h3 className="mb-0">Manage Sellers</h3>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Seller Name</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sellers.map((seller, index) => (
                                        <tr key={index}>
                                            <td>{seller.username}</td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveSellerRights(seller.username)}
                                                >
                                                    Remove Seller Rights
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Create Admin Modal */}
            <Modal show={showCreateAdmin} onHide={() => setShowCreateAdmin(false)}>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>Create New Admin</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateAdmin}>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAdmin.username}
                                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowCreateAdmin(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Create Admin
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default AdminHome;
