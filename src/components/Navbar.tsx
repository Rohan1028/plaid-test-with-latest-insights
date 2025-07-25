import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full py-4 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#152124' }}>
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif font-semibold text-incluya-text-dark">INCLUYA</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/#features" className="font-medium text-incluya-text-dark hover:text-incluya-yellow-dark transition-colors">
            Features
          </Link>
          <Link to="/#how-it-works" className="font-medium text-incluya-text-dark hover:text-incluya-yellow-dark transition-colors">
            How It Works
          </Link>
          <Link to="/#pricing" className="font-medium text-incluya-text-dark hover:text-incluya-yellow-dark transition-colors">
            Pricing
          </Link>
          <Button variant="outline" className="border-incluya-yellow-dark text-incluya-text-dark hover:bg-incluya-yellow/20">
            Log In
          </Button>
          <Button className="bg-incluya-yellow-dark hover:bg-incluya-yellow text-incluya-text-dark">
            Sign Up
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background pt-16 px-4 animate-fade-in">
          <div className="flex flex-col items-center gap-8 text-lg">
            <Link 
              to="/#features" 
              className="font-medium text-incluya-text-dark hover:text-incluya-yellow-dark transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link 
              to="/#how-it-works" 
              className="font-medium text-incluya-text-dark hover:text-incluya-yellow-dark transition-colors"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              to="/#pricing" 
              className="font-medium text-incluya-text-dark hover:text-incluya-yellow-dark transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <div className="flex flex-col w-full gap-4 mt-4">
              <Button 
                variant="outline" 
                className="w-full border-incluya-yellow-dark text-incluya-text-dark hover:bg-incluya-yellow/20"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Button>
              <Button 
                className="w-full bg-incluya-yellow-dark hover:bg-incluya-yellow text-incluya-text-dark"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Button>
            </div>
            <button 
              className="absolute top-4 right-4" 
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
