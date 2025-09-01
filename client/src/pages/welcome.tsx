import { Button } from "@/components/ui/button";
import { Apple, Mail } from "lucide-react";
import { FaGoogle } from "react-icons/fa";

interface WelcomeProps {
  onAuth: (provider: string) => void;
  onGuest: () => void;
}

export default function Welcome({ onAuth, onGuest }: WelcomeProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6 fade-in">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">NoteSync</h1>
          <p className="text-gray-400 text-lg">Sync your notes across all your accounts</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <Button 
            onClick={() => onAuth('icloud')}
            className="w-full bg-white text-black py-4 px-6 rounded-xl font-medium hover:bg-gray-100 transition-colors h-auto"
            data-testid="button-signin-icloud"
          >
            <Apple className="mr-3 h-5 w-5" />
            Sign in with iCloud
          </Button>
          
          <Button 
            onClick={() => onAuth('google')}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors h-auto"
            data-testid="button-signin-google"
          >
            <FaGoogle className="mr-3 h-5 w-5" />
            Sign in with Google
          </Button>
          
          <Button 
            onClick={() => onAuth('exchange')}
            className="w-full bg-gray-700 text-white py-4 px-6 rounded-xl font-medium hover:bg-gray-600 transition-colors h-auto"
            data-testid="button-signin-exchange"
          >
            <Mail className="mr-3 h-5 w-5" />
            Sign in with Exchange
          </Button>
        </div>
        
        <Button 
          variant="link"
          onClick={onGuest}
          className="text-accent-blue hover:underline font-medium"
          data-testid="button-continue-guest"
        >
          Continue as Guest
        </Button>
      </div>
    </div>
  );
}
