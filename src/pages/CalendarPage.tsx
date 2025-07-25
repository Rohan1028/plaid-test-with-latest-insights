import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, isSameWeek } from 'date-fns';
import BottomNavigation from '@/components/BottomNavigation';
import ChatSidebar from '@/components/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
const CalendarPage = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();

  // Get user's first name from full_name or email
  const getUserName = () => {
    return 'Ash';
  };

  // Helper function to format date for capsules
  const formatDateForCapsule = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  // Generate activities for the current week only (today and upcoming)
  const generateWeeklyActivities = () => {
    const today = new Date();
    const exerciseTemplates = [{
      title: 'Childhood Money\nConnection Journal Update',
      duration: '5 mins',
      type: 'journal'
    }, {
      title: 'Spending Trigger\nAwareness Practice',
      duration: '8 mins',
      type: 'practice'
    }, {
      title: 'Gratitude for\nMoney Boundaries',
      duration: '6 mins',
      type: 'gratitude'
    }, {
      title: 'Weekly Spending\nReview & Reflection',
      duration: '12 mins',
      type: 'review'
    }];
    const activities = [];
    let currentDate = addDays(today, 1); // Start from tomorrow
    let templateIndex = 0;

    // Generate activities from tomorrow until the end of the week
    while (isSameWeek(currentDate, today)) {
      const template = exerciseTemplates[templateIndex % exerciseTemplates.length];
      activities.push({
        id: activities.length + 1,
        title: template.title,
        date: new Date(currentDate),
        duration: template.duration,
        timeline: format(currentDate, 'EEEE'),
        type: template.type
      });
      currentDate = addDays(currentDate, 1);
      templateIndex++;
    }
    return activities;
  };

  // Generate upcoming exercises for the current week
  const upcomingExercises = generateWeeklyActivities();
  const handleBackClick = () => {
    navigate('/chat');
  };
  const handleFeaturedExerciseClick = () => {
    // Handle featured exercise start
    console.log('Featured exercise clicked');
  };

  // Calculate the precise line height to connect capsule centers
  const calculateLineHeight = () => {
    // More accurate measurements based on actual rendered heights
    const featuredCardHeight = 240; // Actual measured height of the featured card
    const featuredPadding = 16; // pb-4 padding

    // Each upcoming exercise card height + padding
    const exerciseCardHeight = 72; // Actual measured height of upcoming exercise cards
    const exercisePadding = 16; // pb-4 padding

    // Calculate total height from center of "Today" capsule to center of last capsule
    // Featured section: card height + padding
    const featuredSectionHeight = featuredCardHeight + featuredPadding;

    // Upcoming exercises: full number of exercises * (card height + padding)
    // This will reach the center of the last capsule
    const upcomingExercisesHeight = upcomingExercises.length * (exerciseCardHeight + exercisePadding);

    // Total height from center of first capsule to center of last capsule
    const totalHeight = featuredSectionHeight + upcomingExercisesHeight;
    return `${totalHeight}px`;
  };
  return <div className="flex h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && <ChatSidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen" style={{
      backgroundColor: '#030003'
    }}>
        {/* Header - both mobile and desktop */}
        <div className="sticky top-0 z-50 border-b border-white/10" style={{
        backgroundColor: '#030003'
      }}>
          {isMobile ? <div className="flex items-center justify-between px-5 py-2">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/dc796d96-cbad-4610-b735-c58ee884fec4.png" alt="Logo" className="w-6 h-6" />
                <span className="text-white font-dm-sans font-light tracking-wide text-lg">Check-In.</span>
              </div>
              
              <Button variant="ghost" onClick={handleBackClick} className="text-white/70 hover:text-white hover:bg-white/10 text-sm px-3 py-1">
                <ArrowLeft size={16} />
              </Button>
            </div> : <div className="pt-2 pb-1.5 flex justify-between items-center px-[16px]">
              <div className="flex items-center gap-3">
                <span className="text-white font-dm-sans font-light tracking-wide text-md text-lg">Check-In.</span>
              </div>
            </div>}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-5 py-8 overflow-y-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
              {/* Image Placeholder */}
              <div className="flex justify-center mb-2">
                <div className="w-[92px] h-[92px] flex items-center justify-center">
                  <img src="/lovable-uploads/efd9cc63-2c95-4c02-94b3-76a0f7be9bc9.png" alt="Plant icon" className="w-[92px] h-[92px] object-contain opacity-60" />
                </div>
              </div>

              {/* Personalized Greeting */}
              <div className="space-y-2">
                <h1 className="text-white text-center text-3xl font-dm-sans font-normal">Hi {getUserName()},</h1>
                  <p className="font-dm-sans leading-tight text-center text-xl text-white/75 px-[109px] font-extralight">
                    You're one step away from a healthier relationship with shopping this week!
                  </p>
              </div>

              {/* Section Title */}
              <div className="space-y-3 pt-8 py-[24px]">
                <h2 className="tracking-wider uppercase font-dm-sans text-center text-white/60 text-xs font-thin">
                  WE'VE CURATED WEEKLY PLANS FOR YOU!
                </h2>

                {/* Timeline Container with Continuous Line */}
                <div className="relative overflow-visible">
                  {/* Continuous Timeline Line - centered with capsules and in background */}
                  <div className="absolute w-[1px] z-0" style={{
                  backgroundColor: '#2B2B2B',
                  left: '40px',
                  // Center of the 80px wide capsule container
                  top: '16px',
                  // Center of the first capsule (32px height / 2)
                  height: calculateLineHeight()
                }}></div>

                  {/* Featured Exercise Card with Timeline Structure */}
                  <div className="flex relative overflow-visible">
                    {/* Date Capsule for Featured Exercise */}
                    <div className="flex flex-col items-center mr-4 relative z-10">
                      <div className="h-8 rounded-full px-3 flex items-center justify-center min-w-[80px] relative z-10" style={{
                      backgroundColor: '#111011'
                    }}>
                        <span className="text-white/80 text-xs font-dm-sans whitespace-nowrap font-light">
                          Today
                        </span>
                      </div>
                    </div>
                    
                    {/* Featured Exercise Card */}
                    <div className="flex-1 pb-4 overflow-visible">
                      <Card className="relative overflow-hidden border-none bg-white/5 backdrop-blur-md aspect-[16/9] cursor-pointer transition-all duration-300 transform-gpu will-change-transform origin-center hover:scale-105 active:scale-95" onClick={handleFeaturedExerciseClick} role="button" tabIndex={0} onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFeaturedExerciseClick();
                      }
                    }} style={{
                      transformOrigin: 'center center'
                    }}>
                        <div className="absolute inset-0 bg-cover bg-center opacity-100" style={{
                        backgroundImage: `url('/lovable-uploads/6010a580-f189-4b65-a76b-11b168198077.png')`
                      }}></div>
                        <CardContent className="relative pl-6 pr-10 pb-6 pt-6 flex flex-col h-full">
                          <div className="space-y-1">
                            <span className="text-white/60 text-xs font-dm-sans font-medium tracking-wide uppercase">
                              YOUR MONEY EXERCISE
                            </span>
                            <h3 className="text-white font-dm-sans leading-tight text-2xl font-normal px-0">
                              Childhood Money<br />Connection Deep Dive
                            </h3>
                          </div>
                          
                          <div className="flex items-end justify-between mt-auto">
                            <div className="flex items-center gap-2 text-white text-base font-dm-sans">
                              <span>15 mins • Today</span>
                            </div>
                            
                            <Button className="bg-white hover:bg-white/90 text-black rounded-full border border-white font-dm-sans">
                              Let's tackle this
                              <ArrowRight size={16} className="ml-0.5 text-black" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Timeline View for Upcoming Exercises */}
                  <div className="space-y-0 relative">
                    {upcomingExercises.map((exercise, index) => <div key={exercise.id} className="flex relative">
                        {/* Date Capsule */}
                        <div className="flex flex-col items-center mr-4 relative z-10">
                          <div className="h-8 rounded-full px-3 flex items-center justify-center min-w-[80px] relative z-10" style={{
                        backgroundColor: '#111011'
                      }}>
                            <span className="text-white/80 text-xs font-dm-sans whitespace-nowrap font-light">
                              {formatDateForCapsule(exercise.date)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Activity Card */}
                        <div className="flex-1 pb-4">
                          <Card className="border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <h4 className="text-white text-base font-dm-sans font-medium leading-tight flex-1 whitespace-pre-line">
                                  {exercise.title}
                                </h4>
                                <div className="text-white/60 text-xs font-dm-sans font-light self-end">
                                  {exercise.duration} • {exercise.timeline}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation for mobile */}
        {isMobile && <BottomNavigation />}
      </div>
    </div>;
};
export default CalendarPage;