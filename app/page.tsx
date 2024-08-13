

import EventCalendar from "./components/EventCalendar";


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">AI-Enhanced World Events 📆 Calendar</h1>
      <EventCalendar />
    </div>
  );
}
