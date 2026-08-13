import "./App.css";
import { AuthProvider } from "./features/auth/AuthContext";
import AppRoutes from "./routes";
import { ThemeProvider } from "./theme/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
