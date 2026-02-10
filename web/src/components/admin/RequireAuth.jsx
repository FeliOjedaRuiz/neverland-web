import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children }) => {
	const token = localStorage.getItem('token');
	const location = useLocation();

	if (!token) {
		// Redirect to login but save the current location to return after login
		return <Navigate to="/admin/login" state={{ from: location }} replace />;
	}

	return children;
};

export default RequireAuth;
