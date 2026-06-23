'use client';

import React, { useEffect, useState } from 'react';

export default function SystemStatusLiveClock() {
    const [time, setTime] = useState<string>('');

    useEffect(() => {
        // Wall-clock subscription — genuine effect (interval), initial sync
        // setTime kicks off the display before the first tick.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTime(new Date().toLocaleTimeString());
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Prevent hydration mismatch by initially rendering nothing or a placeholder
    if (!time) {
        return <p className="text-xs md:text-sm font-bold text-gray-700">Loading...</p>;
    }

    return <p className="text-xs md:text-sm font-bold text-gray-700">{time}</p>;
}
