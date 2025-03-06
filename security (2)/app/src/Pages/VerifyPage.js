import React, { useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import config from '../config';

const apiUrl = config.apiUrl

function VerifyPage() {
    const token = localStorage.getItem('authToken');

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSendOTP = async () => {
        try {
            // Send request to backend to generate & send OTP
            const response = await fetch(`${apiUrl}/user/startVerify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
            });

            if (response.ok) {
                setOtpSent(true);
                setMessage("OTP sent! Please check your email or phone.");
                setError(null);
            } else {
                setOtpSent(false);
                setError("Something went wrong. Please try again");
            }


        } catch (err) {
            setError("Failed to send OTP. Please try again.");
            setMessage(null);
        }
    };

    const handleVerifyOTP = async () => {
        try {
            // Send OTP for verification
            const response = await fetch(`${apiUrl}/user/verifyAccount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    otp: otp,
                })
            });

            if (response.ok) {
                setMessage("✅ Verification successful!");
                setError(null);
            } else {
                setError("❌ Invalid OTP. Please try again.");
                setMessage(null);
            }
        } catch (err) {
            setError("Error verifying OTP. Please try again.");
            setMessage(null);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Verify Your Account</h2>

            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {!otpSent ? (
                <Button variant="primary" onClick={handleSendOTP}>
                    Send OTP
                </Button>
            ) : (
                <div className="mt-3">
                    <Form.Group>
                        <Form.Label>Enter OTP</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter your OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="success" className="mt-2" onClick={handleVerifyOTP}>
                        Verify OTP
                    </Button>
                </div>
            )}
        </div>
    );
}

export default VerifyPage;
