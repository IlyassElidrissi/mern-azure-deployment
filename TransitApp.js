const redis = require('redis');
// Configure active redis client pool
const client = redis.createClient();

client.on('error', err => console.error('Redis Runtime Exception:', err));

async function initializeApp() {
    await client.connect();
    console.log('🛰️ Connected to Redis Cluster Engine.');

    // 1. Ingest Sample GTFS Geo-Locations
    // Data structures match: Key, Longitude, Latitude, Station Name Identifier
    await client.geoAdd('nyc_stops', [
        { longitude: -73.9857, latitude: 40.7484, member: 'stop:empire_state' },
        { longitude: -73.9886, latitude: 40.7527, member: 'stop:times_square' },
        { longitude: -74.0113, latitude: 40.7075, member: 'stop:wall_street' }
    ]);

    // 2. Ingest Sample Temporal Schedule Timelines using Sorted Sets
    // The sorted score maps a Unix Epoch Timestamp representation of arrival schedules
    await client.zAdd('schedule:stop:times_square', [
        { score: 1716634800, value: 'Train_A-12:00PM' },
        { score: 1716635700, value: 'Train_B-12:15PM' },
        { score: 1716636600, value: 'Train_C-12:30PM' }
    ]);
    
    console.log('✅ Ingestion steps complete.');
}

// 3. Execution Pipeline Logic: Plan Nearby Commutes
async function planTrip(userLon, userLat, maxDistanceMeters) {
    console.log(`\n🔍 Searching for stops within ${maxDistanceMeters}m of coordinates: [${userLon}, ${userLat}]...`);
    
    // Perform Spatial Lookup across memory space
    const nearbyStops = await client.geoSearch(
        'nyc_stops',
        { longitude: userLon, latitude: userLat },
        { radius: maxDistanceMeters, unit: 'm' }
    );

    if (nearbyStops.length === 0) {
        console.log("❌ No active transit options identified nearby.");
        return;
    }

    for (const stop of nearbyStops) {
        console.log(`📍 Station Identified nearby: ${stop}`);
        
        // Query temporal schedules for the identified stop (Simulating a 12:00 PM to 12:45 PM window)
        const activeVehicles = await client.zRangeByScore(
            `schedule:${stop}`,
            1716634800,
            1716637500
        );
        
        console.log(`   🚍 Upcoming Departures:`, activeVehicles);
    }
}

// Bootstrap flow loop execution wrapper
(async () => {
    await initializeApp();
    // Simulate user standing right near Times Square location
    await planTrip(-73.9880, 40.7520, 500); 
    process.exit();
})();
