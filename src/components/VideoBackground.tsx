
import React, { useEffect, useRef } from 'react';

const VideoBackground = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Autoplay the video when component mounts
    if (videoRef.current) {
      // Try to play the video with user interaction simulation
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing the video:", error);
          // If autoplay is prevented, we'll show a message in console
          console.log("Video autoplay may be blocked by browser. User interaction might be required.");
        });
      }
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
      <video 
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute w-full h-full object-cover"
        onError={(e) => console.error("Video failed to load:", e)}
        onLoadStart={() => console.log("Video started loading")}
        onLoadedData={() => console.log("Video data loaded")}
      >
        <source 
          src="https://raw.githubusercontent.com/saltnpepper12/videos/main/5416362-uhd_2732_1440_25fps.mp4" 
          type="video/mp4" 
        />
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoBackground;
