import SiteNav from '../components/SiteNav'
import Footer from '../components/Footer'

const content = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy policy template.',
    intro: 'This page is a starter privacy-policy structure for the Trading Academy website. Replace it with your reviewed, jurisdiction-specific policy before production launch.',
    sections: [
      ['Information we collect', 'Account information such as email address, profile details, payment-submission information, lesson progress, and basic application activity may be stored to operate the platform.'],
      ['How information is used', 'Information is used to provide account access, manage course access, process submitted payment-review records, support lesson progress, and maintain the website.'],
      ['Service providers', "Trading Academy uses Supabase for authentication and database services, YouTube for embedded lesson video hosting, and Cloudflare for website delivery. Review the providers' current privacy documentation before publishing a final policy."],
      ['Data choices', 'Users should be provided with a practical way to request information about their account data or ask for corrections/deletion where required by applicable law.'],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of use template.',
    intro: 'This page is a starter terms-of-use structure. Replace it with final terms reviewed for your business, payment model, and applicable jurisdiction before production launch.',
    sections: [
      ['Educational content', 'Trading Academy provides educational material. Content is not personalized financial advice and does not guarantee any trading result, return, or outcome.'],
      ['Account responsibility', 'Users are responsible for keeping their login credentials secure and for providing accurate information when using the platform.'],
      ['Payments and access', "Payment submissions are reviewed according to the site's published process. A submitted TXID is not represented as automatically verified by this application."],
      ['Acceptable use', 'Do not misuse the platform, attempt unauthorized access, interfere with service operation, or copy/re-distribute protected course content without permission.'],
    ],
  },
}

export default function Legal({ type = 'privacy' }) {
  const page = content[type] || content.privacy
  return <div className="app-shell"><SiteNav /><main className="page-light legal-page">
    <div className="container container-narrow legal-head"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></div>
    <div className="container container-narrow legal-content">
      {page.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
    </div>
  </main><Footer /></div>
}
