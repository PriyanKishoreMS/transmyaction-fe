import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

function AuthCallback() {
	const { login } = useAuth();
	const [cookies, _, removeCookie] = useCookies(["tokens"]);
	const navigate = useNavigate();

	useEffect(() => {
		console.log("in here in authcallback");
		const processAuth = async () => {
			const tokens = await cookies.tokens;
			if (!tokens) {
				console.log("No tokens found in cookies");
				navigate("/");
				return;
			}
			try {
				const { accessToken, refreshToken, user } = tokens;
				console.log(user, "user");
				const { username, email, avatar } = user;
				login({ accessToken, refreshToken }, { username, email, avatar });
				removeCookie("tokens");
				navigate("/");
			} catch (error) {
				console.error("Error processing auth tokens:", error);
				navigate("/");
			}
		};

		processAuth();
	}, [cookies, login, navigate, removeCookie]);

	return (
		<div className='card'>
			<h1>Authenticating...</h1>
		</div>
	);
}

export default AuthCallback;
