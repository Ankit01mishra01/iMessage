import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const UserAuth = ({ children }) => {
    const { user, setUser } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        if (user) {
            setLoading(false);
            return;
        }

        axios
            .get('/users/profile')
            .then((res) => {
                setUser(res.data.user);
                setLoading(false);
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                navigate('/login');
            });
    }, [navigate, setUser, user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
};

export default UserAuth;
