
import React from 'react';
import { Button } from '@/components/ui/button';

const CallToAction = () => {
  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-incluya-turquoise-dark rounded-2xl p-8 md:p-12 shadow-xl">
          {/* Decorative elements */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 bg-incluya-yellow opacity-20 blob-shape" 
            style={{ zIndex: 0 }}
          ></div>
          <div 
            className="absolute left-0 bottom-0 w-48 h-48 bg-incluya-peach opacity-20 blob-shape" 
            style={{ zIndex: 0 }}
          ></div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Relationship with Money?
            </h2>
            <p className="text-lg text-white mb-8 max-w-lg mx-auto">
              Join thousands who are using Incluya to reduce financial anxiety and build healthier money relationships.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-incluya-yellow-dark hover:bg-incluya-yellow text-incluya-text-dark text-lg py-6 px-8">
                Get Started Free
              </Button>
              <Button variant="outline" className="bg-white border-white text-incluya-text-dark hover:bg-gray-100 text-lg py-6 px-8">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
