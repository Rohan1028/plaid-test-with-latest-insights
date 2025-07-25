
import React from 'react';

const Quote = () => {
  return (
    <section className="relative py-20 bg-incluya-turquoise overflow-hidden">
      {/* Decorative elements */}
      <div 
        className="absolute left-0 bottom-0 w-64 h-64 bg-incluya-yellow opacity-20 blob-shape" 
        style={{ zIndex: 0 }}
      ></div>
      <div 
        className="absolute right-8 top-8 w-40 h-40 bg-incluya-peach opacity-30 blob-shape" 
        style={{ zIndex: 0 }}
      ></div>
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <svg className="w-12 h-12 mx-auto mb-6 text-white" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.8 6.4C7.92 8.64 6 11.36 6 14.96c0 5.04 2.16 8.8 7.52 11.36l1.44-2.4C10.56 21.68 9.76 19.6 9.76 17.68c0-.8.16-1.44.48-2.16C12.72 16.24 14 17.76 14 20.4c0 2.96-1.84 5.2-4.72 5.2-3.28 0-5.84-2.88-5.84-7.36 0-5.28 2.8-10.08 7.92-14L10.8 6.4zm17.6 0C25.52 8.64 23.6 11.36 23.6 14.96c0 5.04 2.16 8.8 7.52 11.36l1.44-2.4c-4.4-2.24-5.2-4.32-5.2-6.24 0-.8.16-1.44.48-2.16 2.48.72 3.76 2.24 3.76 4.88 0 2.96-1.84 5.2-4.72 5.2-3.28 0-5.84-2.88-5.84-7.36 0-5.28 2.8-10.08 7.92-14L28.4 6.4z" />
          </svg>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-6 text-white">
            "Self-compassion is like a muscle. The more we practice flexing it, especially when life doesn't go exactly according to plan, the stronger and more resilient our compassion muscle becomes."
          </h2>
          <p className="text-lg font-medium text-white">Sharon Salzberg</p>
        </div>
      </div>
    </section>
  );
};

export default Quote;
