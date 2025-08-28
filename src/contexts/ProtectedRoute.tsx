import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user } = useAuth();

	if (!user) {
		return <Navigate to='/login' replace />;
	}

	return <>{children}</>;
};

export default ProtectedRoute;
