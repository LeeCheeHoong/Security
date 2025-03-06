import React from "react";
import { Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function VerificationBanner({ isVerified }) {
    const navigate = useNavigate();

    return (
        <div className="container mt-3">
            {isVerified ? (
                <Alert variant="success" className="d-flex justify-content-between align-items-center">
                    ✅ Your account is <strong>verified!</strong> Enjoy full access.
                </Alert>
            ) : (
                <Alert variant="warning" className="d-flex justify-content-between align-items-center">
                    <span>⚠️ Your account is <strong>not verified.</strong> Please verify to unlock all features.</span>
                    <Button variant="primary" onClick={() => navigate("/verify")}>
                        Verify Now
                    </Button>
                </Alert>
            )}
        </div>
    );
}

export default VerificationBanner;
