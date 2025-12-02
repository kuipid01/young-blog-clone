const rules = [
  "Always Secure your accts few hours after login",
  "Accounts cannot be replaced after changing the password.",
  { text: "We replace bad accounts, if fault is from us", highlight: "(not after use)" },
  "This rules can be changed at any time without prior notice.",
  "Obscene language to the admins may be grounds for service refusal.",
  "Ignorance of the rules does not absolve you of responsibility.",
  "The response time for technical support and the resolution of all problems/claims is 24/7.",
  "Accounts are always checked by our private program on private mobile proxy prior to sale, so we can guarantee 100% validity of the items.",
  {
    text: "Accounts cannot be returned; instead, they can only be replaced if bad, provided that other rules are complied with.",
    highlight: "replaced if bad, provided that other rules are complied with.",
  },
  "The store is not liable for any account activity. How your account will last depends on how it's used. No replacement or refund for an account suspended/disabled/logged out after a successful login.",
]

export function RulesContent() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">RULES AT Jemil marketplace</h1>

      <ul className="space-y-0">
        {rules.map((rule, index) => (
          <li key={index} className="py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <p className="text-gray-700 leading-relaxed">
                {typeof rule === "string" ? (
                  rule
                ) : (
                  <>
                    {rule.text.replace(rule.highlight, "")}
                    <span className="text-violet-600">{rule.highlight}</span>
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
