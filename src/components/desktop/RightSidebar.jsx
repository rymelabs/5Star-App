import React from 'react';
import TopScorersWidget from './widgets/TopScorersWidget';
import UpcomingFixturesWidget from './widgets/UpcomingFixturesWidget';
import RecentResultsWidget from './widgets/RecentResultsWidget';

const RightSidebar = () => {
  return (
    <div className="flex flex-col gap-6 h-full">
      <TopScorersWidget />
      <UpcomingFixturesWidget />
      <RecentResultsWidget />
    </div>
  );
};

export default RightSidebar;
