// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, Container, Row, Col } from 'react-bootstrap';
import config from '../config';

const apiUrl = config.apiUrl

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!username || !password) {
            setError('Both fields are required');
            return;
        }

        try {
            // Send POST request to backend to register user
            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            // Handle success
            if (response.ok) {
                setSuccess('Registration successful! Please log in.');
                setUsername('');
                setPassword('');
                setError('');

                alert('Register successful! Proceed to login');

                navigate("/")
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <Container fluid className="bg-light min-vh-100">
            <Row className="justify-content-center align-items-center min-vh-100">
                <Col xs={11} sm={8} md={6} lg={4}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">Create Account</h2>
                                <p className="text-muted">Join our community today</p>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4" controlId="username">
                                    <Form.Label className="text-muted">Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="py-2"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="password">
                                    <Form.Label className="text-muted">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="py-2"
                                    />
                                </Form.Group>

                                {error && (
                                    <Alert variant="danger" className="mb-4">
                                        {error}
                                    </Alert>
                                )}
                                {success && (
                                    <Alert variant="success" className="mb-4">
                                        {success}
                                    </Alert>
                                )}

                                <div className="d-grid gap-3">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="py-2 fw-bold"
                                    >
                                        Register
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate("/login")}
                                        className="py-2"
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Register;
