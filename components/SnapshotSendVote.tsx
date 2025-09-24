
import React, { useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';
import styles from './SnapshotSendVote.module.css';
import Button from './Button';
import Modal from './Modal';
import SnapVote from './SnapVote';
import LoadingSpinner from './LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import snapshot from '@snapshot-labs/snapshot.js';
import { Web3Provider } from '@ethersproject/providers';

import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';
import { marked } from 'marked';
import { PrivyUser, Wallet } from '@privy-io/react-auth';

const BANK_OP_CONTRACT = '0x29FAF5905bfF9Cfcc7CF56a5ed91E0f091F8664B';
const OP_BANK_ABI = [
    {"inputs":[{"internalType":"address","name":"_l2Bridge","type":"address"},{"internalType":"address","name":"_l1Token","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_account","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_account","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

const VOTE_PROCESS = {
    "START": "start",
    "INIT": "init",
    "VOTING": "voting",
    "COMPLETE": "complete",
    "IDLE": "idle",
    "THANKS": "thanks",
    "ERROR": "error"
} as const;

type VoteProcess = typeof VOTE_PROCESS[keyof typeof VOTE_PROCESS];

interface Vote {
    id: string;
    voter: string;
    created: number;
    choice: any;
    vp: number;
    space: {
        id: string;
    };
}

interface Proposal {
    id: string;
    title: string;
    body: string;
    choices: string[];
    start: number;
    end: number;
    snapshot: string;
    state: string;
    author: string;
    space: {
        id: string;
        name: string;
    };
    votes: Vote[];
    type: 'basic' | 'weighted' | string;
}

interface SnapshotSendVoteProps {
    title?: string;
    CTAs?: string[];
    token?: string;
    children?: ReactNode;
    url?: string;
    space?: string;
    proposal?: string;
    snaptime?: string | number;
    endtime?: string | number;
    votes?: Vote[];
    propDump: Proposal;
    voteWallet?: string;
}

const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

const truncateEthAddress = (address: string | null | undefined) => {
    if (!address) return "";
    const match = address.match(truncateRegex);
    if (!match) return address;
    return `${match[1]}…${match[2]}`;
};

const SnapshotSendVote: React.FC<SnapshotSendVoteProps> = ({
    title = "Vote Title",
    CTAs = [],
    token = "BANK",
    children = "",
    url = "https://snapshot.box/#/s:tranmer.eth/proposal/0x4ebec339d3e46ba35edf991213358b457b5127bcd78c069259a837b6103091e3",
    space = "tranmer.eth",
    proposal = "0x4ebec339d3e46ba35edf991213358b457b5127bcd78c069259a837b6103091e3",
    snaptime = "unknown",
    endtime = "unknown",
    votes,
    propDump,
    voteWallet = "privy",
}) => {

    const { ready, wallets } = useWallets();
    const { user } = usePrivy();
    const privyUser = user;

    const hub = 'https://hub.snapshot.org';
    const client = new snapshot.Client712(hub);

    const [bankBalance, setBankBalance] = useState<number | null>(null);
    const [embedAdr, setEmbedAdr] = useState<string | null>(null);
    const [personalAdr, setPersonalAdr] = useState<string | null>(null);

    const [voteProcess, setVoteProcess] = useState<VoteProcess>(VOTE_PROCESS.START);
    const [voteVal, setVoteVal] = useState<number | null>(null);
    const [weightedVoteVal, setWeightedVoteVal] = useState<any | null>(null);

    const [allVotes, setAllVotes] = useState<Vote[] | undefined>(propDump.votes);
    const [myVote, setMyVote] = useState<Vote | null>(null);
    const [vp, setVp] = useState<any>({});

    async function startVote(val: number) {
        setVoteProcess(VOTE_PROCESS.INIT);
        console.log(val);

        if (propDump && propDump.type == "weighted") {
            const weightedValues = getWeightedVotingValues();
            setWeightedVoteVal(weightedValues.choices);
        }

        setVoteVal(val);
    }

    function resetVote() {
        setVoteProcess(VOTE_PROCESS.IDLE);
        setVoteVal(0);
    }

    function getCheck(myVote: Vote | null) {
        if (!myVote) {
            return "";
        }
        return "&#10004; ";
    };

    async function sendVote(
        val: number | null,
        choiceType: 'basic' | 'weighted' = 'basic',
        app: string = 'bcard-app',
        voteWith: string = voteWallet,
        reason?: string,
    ) {
        setVoteProcess(VOTE_PROCESS.VOTING);

        const reasonDOM = (document.getElementById("voteReason") as HTMLInputElement)?.value;

        if (choiceType === 'weighted') {
            const weightedChoiceOutput = getWeightedVotingValues();
            const weightedChoice = weightedChoiceOutput.choices;

            if (embedAdr) {
                const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
                if (!embeddedWallet) return;

                const privyProvider = await embeddedWallet.getEthereumProvider();
                const ethersProvider = new Web3Provider(privyProvider);
                const account = embedAdr;

                const submitData = {
                    space: space,
                    proposal: proposal,
                    type: choiceType,
                    choice: weightedChoice,
                    reason: reasonDOM,
                    app: app
                };

                const resultOfSnapVote = await SnapVote(ethersProvider, account, submitData);
                if (resultOfSnapVote) {
                    setVoteProcess(VOTE_PROCESS.THANKS);
                } else {
                    setVoteProcess(VOTE_PROCESS.ERROR);
                }

                const updatedVotes = await getVotes();
                setMyVote(updatedVotes.find((vote) => vote.voter === embedAdr) || null);
            }
            return;
        } else {
            if (embedAdr) {
                const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
                if (!embeddedWallet) return;

                const privyProvider = await embeddedWallet.getEthereumProvider();
                const ethersProvider = new Web3Provider(privyProvider);
                const account = embedAdr;

                const submitData = {
                    space: space,
                    proposal: proposal,
                    type: choiceType,
                    choice: val,
                    reason: reasonDOM,
                    app: app
                };

                const resultOfSnapVote = await SnapVote(ethersProvider, account, submitData);
                if (resultOfSnapVote) {
                    setVoteProcess(VOTE_PROCESS.THANKS);
                } else {
                    setVoteProcess(VOTE_PROCESS.ERROR);
                }

                const updatedVotes = await getVotes();
                setMyVote(updatedVotes.find((vote) => vote.voter === embedAdr) || null);
            }
        }
    }

    async function getVotes(): Promise<Vote[]> {
        let newVotes: Vote[] = [];
        const SNAPSHOT_QUERY_ROUTE = "/api/bc/snap-query";
        const htmlQuery = `query%20Votes%20%7B%0A%20%20votes(first%3A%201000%2C%20where%3A%20%7Bproposal%3A%20%22${proposal}%22%7D)%20%7B%0A%20%20%20%20id%0A%20%20%20%20voter%0A%20%20%20%20created%0A%20%20%20%20choice%0A%20%20%20%20vp%0A%20%20%20%20space%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0A&operationName=Votes`;

        await fetch(SNAPSHOT_QUERY_ROUTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: htmlQuery }),
        })
            .then(response => response.json())
            .then(data => {
                newVotes = data.data.data.votes;
                setAllVotes(newVotes);
            });
        return newVotes;
    }

    async function getVP(address: string, space: string, proposal: string) {
        const SnapQLquery = `https://hub.snapshot.org/graphql?query=query%20%7B%0A%20%20vp%20(%0A%20%20%20%20voter%3A%20%22${address}%22%0A%20%20%20%20space%3A%20%22${space}%22%0A%20%20%20%20proposal%3A%20%22${proposal}%22%0A%20%20)%20%7B%0A%20%20%20%20vp%0A%20%20%20%20vp_by_strategy%0A%20%20%20%20vp_state%0A%20%20%7D%20%0A%7D%0A`;
        let qReturn: any = {};
        await fetch('/api/bc/snap-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, space, proposal, q: SnapQLquery }),
        })
            .then(response => response.json())
            .then(data => {
                qReturn = data;
                if (qReturn.data) {
                    qReturn = qReturn.data;
                }
                setVp({ ...vp, [address]: qReturn });
                return qReturn;
            });
    }

    async function getSetBalance(token: string) {
        if (token !== "BANK") return 0;
        if (!embedAdr) return 0;

        let consolidatedBalance: any = {};
        let embedVP = vp[embedAdr] ? vp[embedAdr] : 0;
        consolidatedBalance.embedded = embedVP;
        consolidatedBalance.combined = embedVP;

        if (Object.keys(vp).length === 0 && embedVP === 0) {
            const htmlQuery = `query%20%7B%0A%20%20vp%20(%0A%20%20%20%20voter%3A%20%22${embedAdr}%22%0A%20%20%20%20space%3A%20%22${space}%22%0A%20%20%20%20proposal%3A%20%22${proposal}%22%0A%20%20)%20%7B%0A%20%20%20%20vp%0A%20%20%20%20vp_by_strategy%0A%20%20%20%20vp_state%0A%20%20%7D%20%0A%7D%0A`;
            await fetch("/api/bc/snap-query", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: embedAdr, space, proposal, q: htmlQuery }),
            })
                .then(response => response.json())
                .then(data => {
                    embedVP = data.data.data.vp.vp;
                    setVp({ ...vp, [embedAdr]: embedVP });
                    consolidatedBalance.embedded = embedVP;
                    consolidatedBalance.combined = embedVP;
                });
        }

        const publicClient = createPublicClient({ chain: optimism, transport: http() });
        const bal = await publicClient.readContract({
            address: BANK_OP_CONTRACT as `0x${string}`,
            abi: OP_BANK_ABI,
            functionName: 'balanceOf',
            args: [embedAdr as `0x${string}`]
        });

        setBankBalance(embedVP);
        return consolidatedBalance;
    }

    async function getSetEmbeddedAddress(): Promise<string | null> {
        const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
        if (embeddedWallet) {
            setEmbedAdr(embeddedWallet.address);
            return embeddedWallet.address;
        }
        return null;
    }

    async function getSetPersonalAddress(): Promise<string | null> {
        if (!privyUser) return null;
        const linkedWallet = privyUser.linkedAccounts.find((wallet) => wallet.type === 'wallet' && wallet.connectorType !== 'embedded');
        if (!linkedWallet) {
            setPersonalAdr(null);
            return null;
        }
        const connectedWallet = wallets.find((wallet) => wallet.walletClientType !== 'privy' && wallet.address === linkedWallet.address);
        if (!connectedWallet) {
            setPersonalAdr(null);
            return null;
        } else {
            setPersonalAdr(connectedWallet.address);
            return connectedWallet.address;
        }
    }

    function snapToNice(_snaptime: string | number): string {
        if (_snaptime === "unknown") return "unknown";
        const snaptime = new Date(Number(_snaptime) * 1000);
        return `${formatDistanceToNow(snaptime)}`;
    }

    function isEnded(_endtime: string | number): boolean {
        if (_endtime === "unknown") return false;
        const now = new Date();
        const endtime = new Date(Number(_endtime) * 1000);
        return now > endtime;
    }

    function ReasonInput() {
        return <input id='voteReason' className={styles.inputTextbox} type="textbox" placeholder="Share your reason(optional)" />;
    }

    function SpaceLabelBadge({ space }: { space: string }) {
        const CDNurl = `https://cdn.stamp.fyi/space/s:${space}`;
        return <Image src={CDNurl} alt={space} className={styles.spaceLabel} width={50} height={50} />;
    }

    function markDown(input: ReactNode, limit_length = false): string {
        let html: string | null = null;
        marked.setOptions({ breaks: true, gfm: true });
        const minifyUrl = (url: string) => {
            if (url.length <= 30) return url;
            const urlObj = new URL(url);
            return `${urlObj.hostname}/...${url.slice(-20)}`;
        };
        const processHtml = (htmlContent: string) => {
            return htmlContent.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/g,
                (match, quote, url, text) => {
                    if (text === url) {
                        return `<a href=${quote}${url}${quote} target="_blank" rel="noopener noreferrer">${minifyUrl(url)}</a>`;
                    }
                    return match.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
                }
            );
        };
        if (typeof input === 'object' && input && 'props' in input && input.props.children) {
            html = processHtml(marked.parse(input.props.children));
        } else if (typeof input === 'string') {
            html = processHtml(marked.parse(input));
        }
        let trimmedHtml = html;
        if (html && html.length > 500) {
            trimmedHtml = html.substring(0, 500);
        }
        if (limit_length) {
            return trimmedHtml || '';
        } else {
            return html || '';
        }
    }

    function DynamicButton({ cta, index }: { cta: string, index: number }) {
        return <Button key={index} className={styles.SendVoteCTA} buttonFunction={() => startVote(index + 1)} buttonText={cta} secondary={true}></Button>;
    }

    function WeightedVotingButton({ cta, COUNT }: { cta: string, COUNT: number }) {
        const [count, setCount] = useState(COUNT);
        const countUp = () => setCount(count + 1);
        const countDown = () => count >= 1 && setCount(count - 1);
        return (
            <div className={styles.WeightedVotingButton} data-count={count}>
                {cta}
                <span className={styles.weightedButtonContainer}>
                    <a className={styles.countButtons} onClick={countDown}>-</a>
                    <span className={styles.countDisplay}>{count}</span>
                    <a className={styles.countButtons} onClick={countUp}>+</a>
                </span>
            </div>
        );
    }

    function WeightedVotingButtons({ startingWeights }: { startingWeights: any }) {
        function getCountForIndex(index: number) {
            if (startingWeights && startingWeights[index + 1]) {
                return startingWeights[index + 1];
            } else {
                return 0;
            }
        }
        return CTAs.map((cta, index) => (
            <WeightedVotingButton key={`weighted-${cta}-${index}`} cta={cta} COUNT={getCountForIndex(index)} />
        ));
    }

    function getWeightedVotingValues() {
        const choices = document.getElementsByClassName(styles.WeightedVotingButton);
        let total = 0;
        const weightedChoice: { [key: string]: number } = {};
        for (let i = 0; i < choices.length; i++) {
            const count = parseInt((choices[i] as HTMLElement).dataset.count || '0');
            total += count;
            if (count > 0) {
                weightedChoice[String(i + 1)] = count;
            }
        }
        return { choices: weightedChoice, total: total };
    }

    function WeightedVotingConfirm({ cta, percent }: { cta: string, percent: number }) {
        const formattedPercent = percent % 1 === 0 ? Math.round(percent) : percent.toFixed(2);
        return <div className={styles.WeightedVotingConfirm}>{formattedPercent}% for {cta}</div>;
    }

    function WeightedVotingConfirmItems({ ctas }: { ctas: string[] }) {
        const choices = weightedVoteVal;
        let total = 0;
        for (const key in choices) {
            total += choices[key];
        }
        if (choices) {
            return (
                <div className={styles.WeightedVotingConfirmContainer}>
                    {ctas.map((cta, index) => {
                        let percent = 0;
                        if (choices[index + 1]) {
                            percent = choices[index + 1] / total * 100;
                        }
                        return <WeightedVotingConfirm key={`weightedconfirm-${cta}-${index}`} cta={cta} percent={percent} />;
                    })}
                </div>
            );
        } else {
            return null;
        }
    }

    useEffect(() => {
        async function init() {
            let myVoteInit: Vote | null = null;

            if (allVotes) {
                allVotes.every(v => {
                    if (v.voter === embedAdr || v.voter === personalAdr) {
                        myVoteInit = v;
                        setMyVote(v);
                        setVoteProcess(VOTE_PROCESS.COMPLETE);
                        return false;
                    }
                    return true;
                });
            } else if (!allVotes && propDump && propDump.votes) {
                if (propDump.votes && propDump.votes.length > 0) {
                    propDump.votes.every(v => {
                        if (v.voter === embedAdr || v.voter === personalAdr) {
                            myVoteInit = v;
                            setMyVote(v);
                            setVp({ ...vp, [v.voter]: v.vp });
                            setAllVotes(propDump.votes);
                            setVoteProcess(VOTE_PROCESS.COMPLETE);
                            return false;
                        }
                        return true;
                    });
                    if (!myVoteInit) {
                        if (isEnded(endtime)) {
                            setAllVotes(propDump.votes);
                            setVoteProcess(VOTE_PROCESS.COMPLETE);
                        } else {
                            setAllVotes(propDump.votes);
                        }
                    }
                }
            }

            if (!myVote) {
                const address = await getSetEmbeddedAddress();
                const pa = await getSetPersonalAddress();
                const balance = await getSetBalance(token);
                if (propDump.votes) {
                    setAllVotes(propDump.votes);
                }
                if (!myVoteInit) {
                    if (allVotes) {
                        if (isEnded(endtime)) {
                            setVoteProcess(VOTE_PROCESS.COMPLETE);
                        } else {
                            setVoteProcess(VOTE_PROCESS.IDLE);
                        }
                    }
                } else {
                    const myVP = myVoteInit.vp;
                    setVp({ ...vp, [address as string]: myVP });
                }
            } else {
                setVoteProcess(VOTE_PROCESS.COMPLETE);
            }
        }

        if (voteProcess === VOTE_PROCESS.START) {
            init();
        } else {
            if (allVotes) {
                allVotes.every(v => {
                    if (v.voter === embedAdr || v.voter === personalAdr) {
                        if (myVote !== v) {
                            setMyVote(v);
                        }
                        return false;
                    }
                    return true;
                });
                if (!myVote) {
                    isEnded(endtime) && setVoteProcess(VOTE_PROCESS.COMPLETE);
                }
            }
        }
    }, [allVotes]);

    function RenderVoteResults() {
        const voteData: any = {};
        if (allVotes && Object.keys(allVotes).length > 0) {
            allVotes.forEach(v => {
                const c = v.choice;
                const vp = v.vp;
                let type = "simple";
                if (typeof c === 'object' && !Array.isArray(c) && c !== null) {
                    type = "weighted";
                    const choiceKeys = Object.keys(c);
                    voteData["total"] = voteData["total"] ? voteData["total"] + vp : vp;
                    for (let i = 0; i < choiceKeys.length; i++) {
                        const thisKey = choiceKeys[i];
                        voteData[v.voter] = voteData[v.voter] ? voteData[v.voter] + c[thisKey] : c[thisKey];
                    }
                    for (let j = 0; j < choiceKeys.length; j++) {
                        const tk = choiceKeys[j];
                        const voteWeight = vp * c[tk] / voteData[v.voter];
                        voteData[tk] = voteData[tk] ? voteData[tk] + voteWeight : voteWeight;
                    }
                } else {
                    voteData[v.choice] = voteData[v.choice] ? voteData[v.choice] + v.vp : v.vp;
                    voteData["total"] = voteData["total"] ? voteData["total"] + v.vp : v.vp;
                }
                if (v.voter === embedAdr) {
                    voteData["myVote"] = v;
                } else {
                    voteData["myVote"] = null;
                }
            });
        }

        function getTextPercentage(inputNumber: number, total: number) {
            return inputNumber ? Number(100 * inputNumber / total).toFixed(1) + "%" : "0%";
        }

        return (
            <div>
                <SpaceLabelBadge space={space as string} />
                <div className={styles.VoteDescription}>
                    {children && <div dangerouslySetInnerHTML={{ __html: markDown(children, false) }} />}
                </div>
                <div className={styles.resultContainer}>
                    <h4>{isEnded(endtime) ? "Final Results" : "Current Results"}</h4>
                    {CTAs.map((cta, index) => (
                        <div className={styles.resultRow} key={`result-${cta}-${index}`}>
                            <div className={styles.resultBar} style={{ width: getTextPercentage(voteData[index + 1], voteData["total"]) }}></div>
                            <div className={styles.resultText}>
                                {cta}&nbsp;
                                {myVote && myVote.choice === index + 1 && <span dangerouslySetInnerHTML={{ __html: getCheck(myVote) }}></span>}
                            </div>
                            <div className={styles.resultPercentage}>{getTextPercentage(voteData[index + 1], voteData["total"])}</div>
                        </div>
                    ))}
                </div>
                {!isEnded(endtime) &&
                    <a className={styles.changeVoteLink} onClick={() => setVoteProcess(VOTE_PROCESS.IDLE)}>Change Vote</a>
                }
                <p className={styles.floatRight}>
                    {isEnded(endtime) ? "ended " + snapToNice(endtime) + " ago" : "...ends in " + snapToNice(endtime)}
                </p>
                <a className={styles.snapshotLink} href={url} target="_blank">View on Snapshot</a>
            </div>
        );
    }

    function RenderVotableSummary() {
        return (
            <div>
                <SpaceLabelBadge space={space as string} />
                <div className={styles.SendVote}>
                    <div className={styles.VoteDescription}>
                        {children && <div dangerouslySetInnerHTML={{ __html: markDown(children, false) }} />}
                    </div>
                    {propDump && propDump.type === "weighted" &&
                        <div className={styles.weightedContainer}>
                            <WeightedVotingButtons startingWeights={weightedVoteVal} />
                            <Button className={styles.weightedContainerButton} buttonFunction={() => startVote(0)} buttonText="Submit Vote" secondary={true}></Button>
                        </div>
                    }
                    {propDump && propDump.type === "basic" && CTAs.length > 0 &&
                        <div className={styles.buttonContainer}>
                            {CTAs.map((cta, index) => (
                                <DynamicButton key={`button-${cta}-${index}`} cta={cta} index={index} />
                            ))}
                        </div>
                    }
                    {myVote && <a className={styles.changeVoteLink} onClick={() => setVoteProcess(VOTE_PROCESS.COMPLETE)}>Show Results</a>}
                    <p className={styles.floatRight}>...ends in {snapToNice(endtime)}</p>
                    <a className={styles.snapshotLink} href={url} target="_blank">View on Snapshot</a>
                </div>
                {voteProcess === VOTE_PROCESS.INIT &&
                    <Modal backButtonClickHandler={() => resetVote()} className={styles.voteModal}>
                        <div className={styles.voteModalContainer}>
                            <div className={styles.SendVote}>
                                {propDump && propDump.type === "weighted" &&
                                    <div className={styles.voteModalInfo}>
                                        <WeightedVotingConfirmItems ctas={CTAs} />
                                        <br /><strong>Voting Power: </strong>{Number(bankBalance).toFixed(2)} {token}
                                        <br /><strong>Snapshot: </strong>{propDump.snapshot}
                                        <br /><strong>Voting Wallet: </strong>{truncateEthAddress(embedAdr)}
                                    </div>
                                }
                                {propDump && propDump.type === "basic" &&
                                    <div className={styles.voteModalInfo}>
                                        <strong>Choice: </strong>{CTAs[voteVal! - 1]}
                                        <br /><strong>Voting Power: </strong>{Number(bankBalance).toFixed(2)} {token}
                                        <br /><strong>Snapshot: </strong>{propDump.snapshot}
                                        <br /><strong>Voting Wallet: </strong>{truncateEthAddress(embedAdr)}
                                    </div>
                                }
                                <ReasonInput />
                                <div className={styles.confirmVoteButtons}>
                                    <a className={styles.cancelNav} onClick={(e) => { e.preventDefault(); resetVote(); }}>cancel</a>
                                    {propDump && propDump.type === "basic" &&
                                        <Button buttonFunction={() => sendVote(voteVal, "basic", "bcard-app")} buttonText={"Vote"}></Button>}
                                    {propDump && propDump.type === "weighted" &&
                                        <Button buttonFunction={() => sendVote(voteVal, "weighted", "bcard-app")} buttonText={"Vote"}></Button>}
                                </div>
                            </div>
                        </div>
                    </Modal>
                }
            </div>
        );
    }

    function RenderSendingVoteModal() {
        return (
            <Modal className={styles.voteModal}>
                <div className={styles.voteModalContainer}>
                    <div className={styles.SendVote}><p>Submitting your vote...</p></div>
                </div>
            </Modal>
        );
    }

    function RenderThanksModal() {
        return (
            <Modal backButtonClickHandler={() => setVoteProcess(VOTE_PROCESS.COMPLETE)}>
                <div className={styles.infoModalContainer}>
                    <h2>Thanks for sharing your voice!</h2>
                    <div className={styles.emoji}>🥳</div>
                    <h3>Your vote helps shape your community.</h3>
                    <Button buttonFunction={() => { setVoteProcess(VOTE_PROCESS.COMPLETE); }} buttonText={"Aw Shucks..."}></Button>
                </div>
            </Modal>
        );
    }

    function RenderErrorModal() {
        return (
            <Modal backButtonClickHandler={() => setVoteProcess(VOTE_PROCESS.COMPLETE)}>
                <div className={styles.infoModalContainer}>
                    <h2>Something went wrong with your vote. Please try again.</h2>
                    <div className={styles.emoji}>😓</div>
                    <h3>It was probably our fault, reach out if you need help.</h3>
                    <Button buttonFunction={() => { setVoteProcess(VOTE_PROCESS.COMPLETE); }} buttonText={"Close"}></Button>
                </div>
            </Modal>
        );
    }

    switch (voteProcess) {
        case VOTE_PROCESS.START:
            return <div><LoadingSpinner /></div>;
        case VOTE_PROCESS.INIT:
            return <RenderVotableSummary />;
        case VOTE_PROCESS.VOTING:
            return <RenderSendingVoteModal />;
        case VOTE_PROCESS.COMPLETE:
            return <RenderVoteResults />;
        case VOTE_PROCESS.THANKS:
            return <RenderThanksModal />;
        case VOTE_PROCESS.ERROR:
            return <RenderErrorModal />;
        default:
            return <RenderVotableSummary />;
    }
};

export default SnapshotSendVote;
