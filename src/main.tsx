import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { StrictMode } from "react";
import { CookiesProvider } from "react-cookie";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import ProtectedRoute from "./contexts/ProtectedRoute.tsx";
import "./index.css";
import AuthCallback from "./pages/AuthCallback.tsx";
import Login from "./pages/Login.tsx";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<CookiesProvider>
					<BrowserRouter>
						<Routes>
							<Route
								path='/'
								element={
									<ProtectedRoute>
										<App />
									</ProtectedRoute>
								}
							/>
							<Route path='/login' element={<Login />} />
							<Route path='/auth-callback' element={<AuthCallback />} />
						</Routes>
					</BrowserRouter>
				</CookiesProvider>
			</AuthProvider>
		</QueryClientProvider>
	</StrictMode>
);
