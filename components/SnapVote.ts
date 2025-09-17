import snapshot from '@snapshot-labs/snapshot.js';

interface SubmitData {
    space: string;
    proposal: string;
    type: string;
    choice: number | number[] | string;
    reason?: string;
    app?: string;
}

export default async function SnapVote(ethersProvider: any, account: string, submitData: SubmitData): Promise<boolean> {

    //console.log("SNAP VOTE: ", submitData, account);

    const hub = 'https://hub.snapshot.org'; // or https://testnet.hub.snapshot.org for testnet
    const client = new snapshot.Client712(hub);

    try {
        // build and commit the vote
        const receipt = await client.vote(ethersProvider, account, submitData);

        if (receipt) {

            let notice = "Proposal Vote #" + submitData.choice + " submitted successfully.";
            if (submitData.reason) {
                notice = notice + " Reason: " + submitData.reason;
            }

            return true;

        }

    } catch (e: any) {

        console.log(e);
        if (e.error_description) {
            //alert(e.error + " : " + e.error_description);
        }
        console.log("Vote failed to send from SnapVote. " + e.error + " : " + e.error_description);

        return false;
    }

    return false;
}
