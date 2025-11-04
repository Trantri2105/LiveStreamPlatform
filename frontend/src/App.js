import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import './App.css';
import {ChannelProvider} from "./context/ChannelContext";
import ChannelRequiredRoute from "./routes/ChannelRequiredRoute";

function App() {
  return (
      <AuthProvider>
          <ChannelProvider>
              <AppRoutes />
          </ChannelProvider>
      </AuthProvider>

  );
}

export default App;