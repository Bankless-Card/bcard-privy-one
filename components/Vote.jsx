import styles from './Vote.module.css';
import SnapshotSendVote from './SnapshotSendVote';
import { useState, useEffect } from 'react';

const QUERY_URL = "https://hub.snapshot.org/graphql?query=%0Aquery%20Spaces%20%7B%0A%20%20spaces(%0A%20%20%20%20first%3A%2020%2C%0A%20%20%20%20skip%3A%200%2C%0A%20%20%20%20orderBy%3A%20%22created%22%2C%0A%20%20%20%20orderDirection%3A%20desc%0A%20%20)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20about%0A%20%20%20%20network%0A%20%20%20%20symbol%0A%20%20%20%20strategies%20%7B%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20network%0A%20%20%20%20%20%20params%0A%20%20%20%20%7D%0A%20%20%20%20admins%0A%20%20%20%20moderators%0A%20%20%20%20members%0A%20%20%20%20filters%20%7B%0A%20%20%20%20%20%20minScore%0A%20%20%20%20%20%20onlyMembers%0A%20%20%20%20%7D%0A%20%20%20%20plugins%0A%20%20%7D%0A%7D%0A%0Aquery%20Proposals%20%7B%0A%20%20proposals(%0A%20%20%20%20first%3A%2020%2C%0A%20%20%20%20skip%3A%200%2C%0A%20%20%20%20where%3A%20%7B%0A%20%20%20%20%20%20space_in%3A%20%5B%22tranmer.eth%22%5D%0A%20%20%20%20%7D%2C%0A%20%20%20%20orderBy%3A%20%22created%22%2C%0A%20%20%20%20orderDirection%3A%20desc%0A%20%20)%20%7B%0A%20%20%20%20id%0A%20%20%20%20title%0A%20%20%20%20body%0A%20%20%20%20choices%0A%20%20%20%20start%0A%20%20%20%20end%0A%20%20%20%20snapshot%0A%20%20%20%20state%0A%20%20%20%20author%0A%20%20%20%20space%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0Aquery%20Votes%20%7B%0A%20%20votes%20(%0A%20%20%20%20first%3A%201000%0A%20%20%20%20where%3A%20%7B%0A%20%20%20%20%20%20proposal%3A%20%22QmPvbwguLfcVryzBRrbY4Pb9bCtxURagdv1XjhtFLf3wHj%22%0A%20%20%20%20%7D%0A%20%20)%20%7B%0A%20%20%20%20id%0A%20%20%20%20voter%0A%20%20%20%20created%0A%20%20%20%20choice%0A%20%20%20%20space%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0Aquery%20Follows%20%7B%0A%20%20follows%20(where%3A%20%7B%20follower%3A%20%220xeF8305E140ac520225DAf050e2f71d5fBcC543e7%22%20%7D)%20%7B%0A%20%20%20%20id%0A%20%20%20%20follower%0A%20%20%20%20space%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%7D%0A%20%20%20%20created%0A%20%20%7D%0A%7D%0A&operationName=Proposals";

export default function Vote({ onlyActiveProposals=false }) {

	const [votes, setVotes] = useState([]);
	const [proposals, setProposals] = useState([]);


	useEffect(() => {

		async function init() {
			let p = await getProposals(onlyActiveProposals);
			//console.log(p);
			setProposals(p);
		}

		init();

	}, []);

	async function getProposals(onlyActiveProposals) {

		// first need a list of eligible spaces to check for proposals
		// then need to get the proposals for each space (LIMIT: 5)
		// then need to get the votes for each proposal (LIMIT: 10)

		try {
	
			// this currently takes a query that returns data from the tranmer.eth space and all proposals contained therin.
			// will need one for each community that has proposals & votes.
			// will need tokens for each community that has proposals & votes.

			// let spaceList = 'tranmer.eth';
			// let spaceList = 'banklessvault.eth","tranmer.eth';		// double quotes around each space name (start and end quotes are hard coded so this is not needed for a single space request)
			let spaceList = process.env.NEXT_PUBLIC_SNAPSHOT_SPACE_ID;		// double quotes around each space name (start and end quotes are hard coded so this is not needed for a single space request)
			let propNum = "5";
			let propState = "*";
			if( onlyActiveProposals ) {
				propState = "active";
			}

			const query = `
			  query Proposals {
			    proposals(
			      first: ${propNum},
			      skip: 0,
			      where: {
			        space_in: ["${spaceList}"],
					state: "${propState}"
			      },
			      orderBy: "created",
			      orderDirection: desc
			    ) {
			      id
			      title
			      body
			      type
			      choices
			      start
			      end
			      snapshot
			      state
			      author
			      space {
			        id
			        name
			      }
			    }
			  }
			`;

			const htmlQuery = encodeURIComponent(query);
			const buildQuery = `https://hub.snapshot.org/graphql?query=${htmlQuery}&operationName=Proposals`;

			const response = await fetch(process.env.NEXT_PUBLIC_SNAPSHOT_QUERY_ROUTE, {
			  method: 'POST',
			  headers: { 'Content-Type': 'application/json' },
			  body: JSON.stringify({
			    query: 'spaces',
			    q: htmlQuery
			  })
			});

			const data = await response.json();
			// console.log(data.data);

			let proposals = data.data.data.proposals;
			
			// Wait for all vote fetching operations to complete
			const votePromises = proposals.map(async (proposal) => {
				// console.log(proposal.id);

				let numVotes = 10;		// max number of votes to get

				const voteQuery = `
				  query Votes {
				    votes(
				      first: ${numVotes},
				      where: {
				        proposal: "${proposal.id}"
				      }
				    ) {
				      id
				      voter
				      created
				      choice
				      vp
				      space {
				        id
				      }
				    }
				  }
				`;

				const encodedVoteQuery = encodeURIComponent(voteQuery);

				const voteResponse = await fetch(process.env.NEXT_PUBLIC_SNAPSHOT_QUERY_ROUTE, {
				  method: "POST",
				  headers: {
				    "Content-Type": "application/json",
				    "authorization": "internal-auth"
				  },
				  body: JSON.stringify({
				    query: "votes",
				    q: encodedVoteQuery
				  })
				});


				const voteData = await voteResponse.json();
				// console.log(voteData.data);
				// setVoteChoices(voteData.data.votes);
				proposal.votes = voteData.data.data.votes;
				return proposal;
			});

			// Wait for all vote fetching to complete
			await Promise.all(votePromises);

			//console.log(proposals);		// verify that all have votes added
			return proposals;

			/* output data is great; has data.proposals: [ array of proposals ]
			
			title is the title
			body is the message
			choices is an array of choices, with string labels
			id is hash of proposal
			snapshot is the snapshot ID
			space has {id, name}
			start and end are unixtime
			state is 'active' or 'closed'
	
			*/

		} catch (e) {
			console.log(e);
			return []; // Return empty array on error
		}
	}


	return (
		<div className={styles.VotePageContainer}>
			<h3>Votes</h3>

		
			{/* for each proposal in the proposals array, create a SnapshotSendVote component */}
			{proposals && proposals.length > 0 && 
				proposals.map((proposal, index) => {

					if(!proposal) {
						// wait for voting data to be loaded
					} else {

					// show all proposals and filter for inactive within component display
						return (
							<div className={styles.snapshotContainer} key={index}>
								<SnapshotSendVote
									title={proposal.title}
									CTAs={proposal.choices}
									token="BANK"
									url={"https://snapshot.box/#/s:"+proposal.space.id+"/proposal/"+proposal.id}
									space={proposal.space.id}
									proposal={proposal.id}
									snaptime={proposal.start}
									endtime={proposal.end}
									voteWallet='privy'		// set to privy for embedded, all others will give personal
									propDump={proposal}
									key={index}
								>
									{proposal.body}
								</SnapshotSendVote>
							</div>
							
						) 

					}
				})
			}

		</div>
	);

	
} //end export