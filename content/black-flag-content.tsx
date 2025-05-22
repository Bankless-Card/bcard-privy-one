export const SITE_CONTENT = {
  title: "We are the Black Flag",
  description: "We are a community of people who find top-down organizations such as big banks, big governments, and big tech stifling. We seek to make bottom-up change through our actions.",
  mission: "Mission 1: Real-World Meetups",
  missionDescription: (<>We reward people around the world for holding in-real-life (IRL) meetups. You can see our
          <a href="https://blackflagcollective.org/funded-events" className="text-white underline hover:text-gray-300"> previously funded events</a> or visit our <a href="https://snapshot.box/#/s:black-flag.eth" className="text-white underline hover:text-gray-300"> Snapshot space</a> to participate in current funding decisions.</>),
  participate: {
    host: {
      title: "Participate as a Host",
      description: "Hosts get retro-funding for holding IRL events.",
      steps: [
        (<>Hold an IRL meetup. Promote the meetup online and be sure to include a black flag emoji (🏴) on your online promotion.</>),
        (<>Post pictures of your meetup online (we recommend <a href="https://warpcast.com/" className="text-white underline hover:text-gray-300">Farcaster</a>).</>),
        (<>DM <a href="https://warpcast.com/links" className="text-white underline hover:text-gray-300">@links</a> with the following info:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Title: (title of your event)</li>
                  <li>Links to online promotion</li>
                  <li>Links to online pictures</li>
                  <li>Attendees: (# of people who attended the event, to be confirmed with pictures)</li>
                  <li>Your ETH address: (must be on BASE)</li>
                </ul></>),
      ]
    },
    voter: {
      title: "Participate as a Voter",
      description: "Voters get to decide which events get funded.",
      steps: [
        (<>Deposit <a href="https://app.cabana.fi/vault/8453/0x119d2bc7bb9b94f5518ce30169457ff358b47535" className="text-white underline hover:text-gray-300">USDC</a> or <a href="https://app.cabana.fi/vault/8453/0x23Cd31beEc8980E7F8AEb7E76D45Fe3da4de1592" className="text-white underline hover:text-gray-300">WETH</a> into one of our PoolTogether pools.
          <ul className="list-disc pl-5 mt-2">
            <li>You can remove your deposit at any time</li>
          </ul>
        </>),
        (<>Follow the <a href="https://warpcast.com/~/channel/blackflag" className="text-white underline hover:text-gray-300">/blackflag channel</a> on Warpcast</>),
        (<>Vote in the <a href="https://snapshot.box/#/s:black-flag.eth" className="text-white underline hover:text-gray-300">monthly Snapshot</a></>),
      ]
    }
  },
  sponsors: [
    {
      name: "BCard Foundation",
      url: "https://getbcard.io/"
    },
    {
      name: "Black Flag DAO",
      url: "https://blackflagdao.notion.site/"
    }
  ],
  footer: (<>This initiative is managed using a <a href="https://basescan.org/address/0xc9Dd18f35E406Bf94cf937c6aAE618D7e84A6A6d" className="text-white underline hover:text-gray-300">Multisig</a> with 2 signers: <a href="https://warpcast.com/links" className="text-white underline hover:text-gray-300">@links</a> and <a href="https://warpcast.com/icedcool" className="text-white underline hover:text-gray-300">@icedcool</a>.</>),
  officialLinks: [
    {
      name: "Farcaster",
      url: "https://warpcast.com/~/channel/blackflag"
    },
    {
      name: "Discord",
      url: "https://discord.gg/blackflagdao"
    },
    {
      name: "Snapshot",
      url: "https://snapshot.box/#/s:black-flag.eth"
    },
    {
      name: "USDC Vault",
      url: "https://app.cabana.fi/vault/8453/0x119d2bc7bb9b94f5518ce30169457ff358b47535"
    },
    {
      name: "WETH Vault",
      url: "https://app.cabana.fi/vault/8453/0x23Cd31beEc8980E7F8AEb7E76D45Fe3da4de1592"
    }
  ]
};