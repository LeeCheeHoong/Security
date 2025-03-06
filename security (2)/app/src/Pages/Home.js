import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import config from '../config';
import VerificationBanner from '../Components/VerificationBanner';

const apiUrl = config.apiUrl;

function Home() {
    const token = localStorage.getItem('authToken');
    const [userAttributes, setUserAttributes] = useState([]);
    const [items, setItems] = useState([]);
    const [sellerId, setSellerId] = useState(null);

    useEffect(() => {
        const fetchUserAttributesAndItems = async () => {
            try {
                // Fetch user attributes
                const attributesResponse = await fetch(`${apiUrl}/auth/getUserAttributes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (attributesResponse.ok) {
                    const data = await attributesResponse.json();
                    setUserAttributes(data.attributes);
                }

                // Fetch items for all users
                const itemsResponse = await fetch(`${apiUrl}/user/list`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    setItems(itemsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchUserAttributesAndItems();
    }, [token]);

    useEffect(() => {
        // Fetch seller ID if user is a seller
        const fetchSellerId = async () => {
            try {
                const response = await fetch(`${apiUrl}/user/getSellerId`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSellerId(data.sellerId);
                }
                return null;
            } catch (error) {
                console.error('Error fetching seller ID:', error);
                return null;
            }
        };
        if (userAttributes.includes('SELLER')) {
            fetchSellerId();
        }
    }, [userAttributes]);

    const isVerified = userAttributes.includes('VERIFIED');
    const isSeller = userAttributes.includes('SELLER');

    return (
        <Container className="my-5">
            <VerificationBanner isVerified={isVerified} />

            <div className="text-center mb-4">
                <h2>Welcome to the Home Page!</h2>
                <p className="lead">You have successfully logged in.</p>
            </div>

            <h3 className="mb-4">Available Items</h3>
            <Row xs={1} md={2} lg={3} className="g-4">
                {items.map((item) => (
                    <Col key={item.id}>
                        <Card>
                            <Card.Body>
                                <Card.Title>{item.item}</Card.Title>
                                <Card.Text>
                                    {item.description}
                                    <br />
                                    <strong>Price: ${item.price}</strong>
                                </Card.Text>
                                {isSeller && item.seller_id === sellerId ? (
                                    <Button variant="secondary" disabled>
                                        Your Item
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={() => handlePurchase(item.id)}
                                        disabled={item.item_status !== 1 || !isVerified}
                                    >
                                        {!isVerified ? 'Verify to Buy' :
                                            item.item_status === 1 ? 'Buy Now' :
                                                item.item_status === 2 ? 'Reserved' : 'Sold'}
                                    </Button>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );

    async function handlePurchase(itemId) {
        try {
            const response = await fetch(`${apiUrl}/user/buyItem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ itemId })
            });

            if (response.ok) {
                // Refresh items after purchase
                const itemsResponse = await fetch(`${apiUrl}/user/list`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    setItems(itemsData);
                }
            }
        } catch (error) {
            console.error('Error purchasing item:', error);
        }
    }
}

export default Home;
