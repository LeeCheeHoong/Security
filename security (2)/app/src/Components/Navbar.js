// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import config from '../config';

const apiUrl = config.apiUrl;

function NavBar({ onLogout }) {
    const [userAttributes, setUserAttributes] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchUserAttributes = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            try {
                const response = await fetch(`${apiUrl}/auth/getUserAttributes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserAttributes(data.attributes);
                }
            } catch (error) {
                console.error('Failed to fetch user attributes:', error);
            }
        };

        fetchUserAttributes();
    }, []);

    const handleRegisterAsSeller = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${apiUrl}/user/registerAsSeller`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
            }
        } catch (error) {
            console.error('Failed to register as seller:', error);
        }
    };

    // Helper function to check if user has specific attribute
    const hasAttribute = (attribute) => userAttributes.includes(attribute);

    // Check if user can apply to be a seller
    const canApplyAsSeller = hasAttribute('VERIFIED') &&
        !hasAttribute('SELLER') &&
        !hasAttribute('PENDING_SELLER');

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand>My App</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            {!hasAttribute('ADMIN') && (
                                <Nav.Link as={Link} to="/">Home</Nav.Link>
                            )}
                            {hasAttribute('SELLER') && (
                                <>
                                    <Nav.Link as={Link} to="/seller-dashboard">Dashboard</Nav.Link>
                                    <Nav.Link as={Link} to="/create-item">Create Item</Nav.Link>
                                </>
                            )}
                            {hasAttribute('ADMIN') && (
                                <Nav.Link as={Link} to="/admin">Admin Panel</Nav.Link>
                            )}
                        </Nav>
                        <Nav>
                            {canApplyAsSeller && (
                                <Button
                                    variant="outline-success"
                                    className="me-3"
                                    onClick={handleRegisterAsSeller}
                                >
                                    Become a Seller
                                </Button>
                            )}
                            {hasAttribute('PENDING_SELLER') && (
                                <Button
                                    variant="outline-warning"
                                    className="me-3"
                                    disabled
                                >
                                    Seller Application Pending
                                </Button>
                            )}
                            <Button variant="outline-light" onClick={onLogout}>
                                Logout
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Success Alert */}
            {showSuccess && (
                <div
                    className="position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-success"
                    style={{ zIndex: 1050 }}
                >
                    Application submitted successfully! Please wait for admin approval.
                </div>
            )}
        </>
    );
}

export default NavBar;
