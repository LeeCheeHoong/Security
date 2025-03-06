import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, Container, Row, Col } from 'react-bootstrap';
import config from '../config';

const apiUrl = config.apiUrl

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Please fill in both fields');
            return;
        }

        try {
            const loginResponse = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (loginResponse.ok) {
                const data = await loginResponse.json();
                localStorage.setItem('authToken', data.token);

                // Check user attributes after successful login
                const attributesResponse = await fetch(`${apiUrl}/auth/getUserAttributes`, {
                    headers: {
                        'Authorization': `Bearer ${data.token}`
                    }
                });

                if (attributesResponse.ok) {
                    const attributesData = await attributesResponse.json();
                    onLogin();

                    // Redirect based on user role
                    if (attributesData.attributes.includes('ADMIN')) {
                        navigate('/admin');
                    } else {
                        navigate('/');
                    }
                }
            } else {
                setError('Invalid credentials');
            }
        } catch (error) {
            setError('An error occurred during login');
        }
    };

    return (
        <Container fluid className="bg-light min-vh-100">
            <Row className="justify-content-center align-items-center min-vh-100">
                <Col xs={11} sm={8} md={6} lg={4}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">Welcome Back</h2>
                                <p className="text-muted">Please login to your account</p>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4" controlId="username">
                                    <Form.Label className="text-muted">Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="py-2"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="password">
                                    <Form.Label className="text-muted">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter your password"
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

                                <div className="d-grid gap-3">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="py-2 fw-bold"
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate("/register")}
                                        className="py-2"
                                    >
                                        Create New Account
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

export default Login;
