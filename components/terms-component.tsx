import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const TermsContent = () => {
  return (
      <Card className="w-full max-w-3xl mx-auto p-6 space-y-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Jemil marketplace TERMS OF USE
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Make sure to use <b>m.facebook.com</b> for first login of Facebook.
            </li>
            <li>
              Request desktop mode for better usage on Chrome, Firefox, Brave browser.
            </li>
            <li>
              Make sure to clear browser history and don’t use PC for first login.
            </li>
            <li>
              We will not replace the account if you get it on checkpoint for ignoring
              the rules.
            </li>
          </ul>
        </section>

        <section>
          <p className="font-semibold">
            Kindly follow the above rule before you login accounts, as we will not
            replace some certain errors made.
          </p>
        </section>

        <section>
          <h3 className="font-bold mb-2">
            MOST RECOMMENDED VPN FOR FACEBOOK: SURFSHARK AND HMA VPN
          </h3>

          <ul className="list-disc pl-5 space-y-1">
            <li>
              Customer must unlock a locked account linked to email for unlock. If not
              linked to email, we replace it.
            </li>
            <li>
              We cannot replace an account because date of birth or name cannot be
              changed.
            </li>
            <li>
              We do not replace damaged marketplace for any Facebook account but 90% of 
              the time marketplace works perfectly.
            </li>
            <li>
              If you want to replace a damaged marketplace account, consider buying an 
              EU to USA account.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold mb-2">
            POV – DO NOT USE SAFARI BROWSER TO LOGIN ANY ACCOUNT YOU PURCHASE ON THIS SITE
            – DO NOT EVER USE APP FOR FIRST LOGIN
          </h3>

          <ul className="list-disc pl-5 space-y-1">
            <li>
              The full validity of the account (within 24hrs after purchase), if no rule
              was broken.
            </li>
            <li>
              We do not replace an account because date of birth cannot be changed.
            </li>
            <li>
              You are required to use <b>m.facebook.com</b> for the first login of any 
              Facebook account before using the app.
            </li>
            <li>
              No warranty for any checkpoint issues caused by not following this rule.
            </li>
          </ul>
        </section>
      </CardContent>
    </Card>

  )
}
