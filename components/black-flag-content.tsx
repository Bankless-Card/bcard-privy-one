import React from 'react';
import Link from 'next/link';
import BCardIntegration from './bcard-integration';

// next up:
// extract the content and generate a template to use the content as input to display the site UI

// site specific content
const SITE_CONTENT = {
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

// function to generate the content template
function contentTemplate(sc=SITE_CONTENT) {
  return (
    <div className="bf-container py-10">
      <section className="mb-16">
        <div className="flex justify-center mb-8">
          <span className="bf-flag text-6xl">🏴</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold uppercase text-center tracking-tight mb-8">
          {sc.title}
        </h1>
        <p className="text-lg text-center max-w-3xl mx-auto mb-8">
          {sc.description}
        </p>
      </section>
        <section className="mb-16" id="mission">
        <h2 className="text-3xl font-bold mb-6 text-center">{sc.mission}</h2>
        <p className="text-lg text-center max-w-3xl mx-auto mb-8">
          {sc.missionDescription}
        </p>
          <div className="bf-grid gap-8 mt-12" id="participate">
          <div className="bf-panel">
            <h3 className="text-2xl font-bold mb-4">{sc.participate.host.title}</h3>
            <p className="mb-4">{sc.participate.host.description}</p>
            <ol className="list-decimal pl-5 space-y-2">
              {sc.participate.host.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          
          <div className="bf-panel">
            <h3 className="text-2xl font-bold mb-4">{sc.participate.voter.title}</h3>
            <p className="mb-4">{sc.participate.voter.description}</p>
            <ol className="list-decimal pl-5 space-y-2">
              {sc.participate.voter.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>
        <BCardIntegration />
        <section className="mb-16" id="sponsors">
        <h2 className="text-3xl font-bold mb-6 text-center">Founding Sponsors</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-8">
          {sc.sponsors.map((sponsor, index) => (
            <a key={index} href={sponsor.url} className="bf-panel p-6 hover:border-white transition-all flex items-center">
              <span className="bf-flag text-xl mr-2">🏴</span>
              <span className="text-xl font-bold">{sponsor.name}</span>
            </a>
          ))}

        </div>
        <p className="text-center mt-8">
          {sc.footer}
        </p>
      </section>
      
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6 text-center">Official Links</h2>
        <ul className="flex flex-wrap justify-center gap-6 mt-8">
          {sc.officialLinks.map((link, index) => (
            <li key={index}>
              <a href={link.url} className="bf-button">
                {link.name}
              </a>
            </li>
          ))}
          
        </ul>
      </section>
      
      <section className="text-center">
        <div className="bf-panel inline-block">
          <Link href="/login" className="text-xl font-bold">
            Get Started with BCard <span className="bf-flag">🏴</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function BlackFlagContent() {
  return contentTemplate(SITE_CONTENT);
  // return (
  //   <div className="bf-container py-10">
  //     <section className="mb-16">
  //       <div className="flex justify-center mb-8">
  //         <span className="bf-flag text-6xl">🏴</span>
  //       </div>
  //       <h1 className="text-4xl sm:text-5xl font-extrabold uppercase text-center tracking-tight mb-8">
  //         We are the Black Flag
  //       </h1>
  //       <p className="text-lg text-center max-w-3xl mx-auto mb-8">
  //         We are a community of people who find top-down organizations such as big banks,
  //         big governments, and big tech stifling. We seek to make bottom-up change through
  //         our actions.
  //       </p>
  //     </section>
  //       <section className="mb-16" id="mission">
  //       <h2 className="text-3xl font-bold mb-6 text-center">Mission 1: Real-World Meetups</h2>
  //       <p className="text-lg text-center max-w-3xl mx-auto mb-8">
  //         We reward people around the world for holding in-real-life (IRL) meetups. You can see our{' '}
  //         <a href="https://blackflag-test.vercel.app/funded-events" className="text-white underline hover:text-gray-300">previously funded events</a> or visit our{' '}
  //         <a href="https://snapshot.box/#/s:black-flag.eth" className="text-white underline hover:text-gray-300">Snapshot space</a> to participate in current funding decisions.
  //       </p>
  //         <div className="bf-grid gap-8 mt-12" id="participate">
  //         <div className="bf-panel">
  //           <h3 className="text-2xl font-bold mb-4">Participate as a Host</h3>
  //           <p className="mb-4">Hosts get retro-funding for holding IRL events.</p>
  //           <ol className="list-decimal pl-5 space-y-2">
  //             <li>Hold an IRL meetup. Promote the meetup online and be sure to include a black flag emoji (🏴) on your online promotion.</li>
  //             <li>Post pictures of your meetup online (we recommend <a href="https://warpcast.com/" className="text-white underline hover:text-gray-300">Farcaster</a>).</li>
  //             <li>
  //               DM <a href="https://warpcast.com/links" className="text-white underline hover:text-gray-300">@links</a> with the following info:
  //               <ul className="list-disc pl-5 mt-2 space-y-1">
  //                 <li>Title: (title of your event)</li>
  //                 <li>Links to online promotion</li>
  //                 <li>Links to online pictures</li>
  //                 <li>Attendees: (# of people who attended the event, to be confirmed with pictures)</li>
  //                 <li>Your ETH address: (must be on BASE)</li>
  //               </ul>
  //             </li>
  //           </ol>
  //         </div>
          
  //         <div className="bf-panel">
  //           <h3 className="text-2xl font-bold mb-4">Participate as a Voter</h3>
  //           <p className="mb-4">Voters get to decide which events get funded.</p>
  //           <ol className="list-decimal pl-5 space-y-2">
  //             <li>
  //               Deposit <a href="https://app.cabana.fi/vault/8453/0x119d2bc7bb9b94f5518ce30169457ff358b47535" className="text-white underline hover:text-gray-300">USDC</a> or <a href="https://app.cabana.fi/vault/8453/0x23Cd31beEc8980E7F8AEb7E76D45Fe3da4de1592" className="text-white underline hover:text-gray-300">WETH</a> into one of our PoolTogether pools.
  //               <ul className="list-disc pl-5 mt-2">
  //                 <li>You can remove your deposit at any time</li>
  //               </ul>
  //             </li>
  //             <li>Follow the <a href="https://warpcast.com/~/channel/blackflag" className="text-white underline hover:text-gray-300">/blackflag channel</a> on Warpcast</li>
  //             <li>Vote in the <a href="https://snapshot.box/#/s:black-flag.eth" className="text-white underline hover:text-gray-300">monthly Snapshot</a></li>
  //           </ol>
  //         </div>
  //       </div>
  //     </section>
  //       <BCardIntegration />
  //       <section className="mb-16" id="sponsors">
  //       <h2 className="text-3xl font-bold mb-6 text-center">Founding Sponsors</h2>
  //       <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-8">
  //         <a href="https://getbcard.io/" className="bf-panel p-6 hover:border-white transition-all flex items-center">
  //           <span className="bf-flag text-xl mr-2">🏴</span>
  //           <span className="text-xl font-bold">BCard Foundation</span>
  //         </a>
  //         <a href="https://blackflagdao.notion.site/" className="bf-panel p-6 hover:border-white transition-all flex items-center">
  //           <span className="bf-flag text-xl mr-2">🏴</span>
  //           <span className="text-xl font-bold">Black Flag DAO</span>
  //         </a>
  //       </div>
  //       <p className="text-center mt-8">
  //         This initiative is managed using a <a href="https://basescan.org/address/0xc9Dd18f35E406Bf94cf937c6aAE618D7e84A6A6d" className="text-white underline hover:text-gray-300">Multisig</a> with 2 signers: <a href="https://warpcast.com/links" className="text-white underline hover:text-gray-300">@links</a> and <a href="https://warpcast.com/icedcool" className="text-white underline hover:text-gray-300">@icedcool</a>.
  //       </p>
  //     </section>
      
  //     <section className="mb-16">
  //       <h2 className="text-3xl font-bold mb-6 text-center">Official Links</h2>
  //       <ul className="flex flex-wrap justify-center gap-6 mt-8">
  //         <li>
  //           <a href="https://warpcast.com/~/channel/blackflag" className="bf-button">
  //             Farcaster
  //           </a>
  //         </li>
  //         <li>
  //           <a href="https://discord.gg/blackflagdao" className="bf-button">
  //             Discord
  //           </a>
  //         </li>
  //         <li>
  //           <a href="https://snapshot.box/#/s:black-flag.eth" className="bf-button">
  //             Snapshot
  //           </a>
  //         </li>
  //         <li>
  //           <a href="https://app.cabana.fi/vault/8453/0x119d2bc7bb9b94f5518ce30169457ff358b47535" className="bf-button">
  //             USDC Vault
  //           </a>
  //         </li>
  //         <li>
  //           <a href="https://app.cabana.fi/vault/8453/0x23Cd31beEc8980E7F8AEb7E76D45Fe3da4de1592" className="bf-button">
  //             WETH Vault
  //           </a>
  //         </li>
  //       </ul>
  //     </section>
      
  //     <section className="text-center">
  //       <div className="bf-panel inline-block">
  //         <Link href="/login" className="text-xl font-bold">
  //           Get Started with BCard <span className="bf-flag">🏴</span>
  //         </Link>
  //       </div>
  //     </section>
  //   </div>
  // );
}
