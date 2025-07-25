
import React, { useEffect, useRef } from 'react';

const VideoBackgroundFeatures = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Autoplay the video when component mounts
    if (videoRef.current) {
      console.log("Video element found, attempting to play");
      // Try to play the video with user interaction simulation
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video started playing successfully");
          })
          .catch(error => {
            console.error("Error playing the video:", error);
            console.log("Video autoplay may be blocked by browser. User interaction might be required.");
          });
      }
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
      <video 
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => console.error("Video failed to load:", e)}
        onLoadStart={() => console.log("Video started loading")}
        onLoadedData={() => console.log("Video data loaded")}
        onCanPlay={() => console.log("Video can play")}
      >
        <source 
          src="https://raw.githubusercontent.com/Rohan1028/investordemo-jul10-insights/blob/main/Login-check.mp4" 
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

export default VideoBackgroundFeatures;
