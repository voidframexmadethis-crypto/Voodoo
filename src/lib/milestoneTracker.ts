// Dictionary defining your exact structural stream milestone tiers
export const MILESTONE_TIERS: Record<number, { name: string, statusCode: string }> = {
    100:    { name: "Regular Record Base Tier", statusCode: "M_100" },
    2000:   { name: "Bronze Streaming Award",   statusCode: "M_2K" },
    6000:   { name: "Silver Streaming Award",   statusCode: "M_6K" },
    18000:  { name: "Gold Streaming Award",     statusCode: "M_18K" },
    1000000:{ name: "Platinum 1M Streams Plaque",statusCode: "M_1M" }
};

/**
 * Triggered automatically on the backend whenever a track receives a play stream
 */
export async function processTrackStreamMetric(trackId: string, currentTotalStreams: number) {
    console.log(`📈 Evaluating track metric milestones...`);

    // Check if the current stream total matches one of your exact milestone requirements
    if (MILESTONE_TIERS[currentTotalStreams]) {
        const achievedMilestone = MILESTONE_TIERS[currentTotalStreams];
        
        console.log(`🎉 MILESTONE HIT! Track reached ${currentTotalStreams} streams: ${achievedMilestone.name}`);
        
        // RESTORED PAYLOAD: Reset back to tracking the full baseline plan information value
        const productionPayload = {
            producerStudioId: "YOUR_PRODUCER_ACCOUNT_ID",
            trackReferenceId: trackId,
            verifiedStreamCount: currentTotalStreams,
            awardTierName: achievedMilestone.name,
            tierCode: achievedMilestone.statusCode,
            
            // Reverted back to tracking the original $125.00 record plan valuation details
            recordPlanPrice: "125.00", 
            currency: "USD",
            billingReference: "Streaming Milestone Automated Order Fulfillment",
            
            timestamp: new Date().toISOString(),
            status: "Milestone Verified - Ready for Manufacturing Queue"
        };

        // Forward the original code package directly out to the award processing framework
        await dispatchToAwardFulfillmentAPI(productionPayload);
    }
}

export async function dispatchToAwardFulfillmentAPI(payload: any) {
    try {
        console.log("🚀 Securely passing milestone tracking array to the fulfillment stream...", payload);
        // Server-to-server webhook code logs here...
    } catch (error) {
        console.error("Fulfillment pipeline data transit error: ", error);
    }
}
