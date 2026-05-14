import React from 'react';
import Myinput from "../../../components/UI/input/Myinput";
import Mybutton from "../../../components/UI/button/Mybutton";
import AuthService from "../API/AuthService";
import {useNavigate} from "react-router-dom";

const FPassword = () => {
    const [email, setEmail] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState(""); // для обратной связи
    const navigate = useNavigate();

    const fPassword = async () => {
        try {
            setLoading(true);
            setMessage("");
            const response = await AuthService.FPassword(email);

            if (response.status === 200) {
                setMessage("Инструкция отправлена на почту");
                setTimeout(() => navigate("/login"), 2000);
            }
        }catch (error) {

                if (error.response?.data?.email) {
                    setMessage(error.response.data.email[0]);
                } else {
                    setMessage("Ошибка отправки");
                }
            } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Myinput
                type="email"
                value={email}
                placeholder="Введите почту"
                onChange={event => setEmail(event.target.value)}
                disabled={loading}
                required
            />
            <Mybutton onClick={fPassword} disabled={loading}>
                {loading ? "Отправка..." : "Восстановить пароль"}
            </Mybutton>
            {message && <p>{message}</p>}
        </div>
    );
};

export default FPassword;