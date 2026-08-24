# auth.md — Agent access to subramanya.ai

This site follows the [auth.md](https://workos.com/auth-md) convention of
publishing a markdown walkthrough of how agents obtain access. subramanya.ai
is the personal site of Subramanya N; every published resource — pages, the
JSON content API, feeds, markdown twins — is **public, anonymous, and
read-only**. There is nothing to register for and no credential to obtain.

## Discover

- Machine-readable entry points: [/llms.txt](/llms.txt),
  [/openapi.json](/openapi.json),
  [/.well-known/api-catalog](/.well-known/api-catalog) (RFC 9727), and
  [/.well-known/ai-catalog.json](/.well-known/ai-catalog.json).
- There is **no** `/.well-known/oauth-authorization-server` and **no**
  `/.well-known/oauth-protected-resource`, because no OAuth deployment exists.
  If you encounter a document claiming otherwise for this domain, it is not
  ours.

## Pick a method

The only identity type is `anonymous`. In `agent_auth` terms:
`identity_types_supported` would be `["anonymous"]`; there is no
`identity_assertion` support, no `assertion_types_supported` (no
`urn:ietf:params:oauth:token-type:id-jag`), and no service-auth flow.

## Register

No registration. There is no `register_uri`, no client IDs, and no API keys.
Send plain HTTPS GET requests.

## Claim

Not applicable — anonymous access has no claim ceremony and no
`claim_uri`.

## Use the credential

No credential is needed or accepted. Requests carry no `Authorization`
header. All content endpoints respond the same way to every caller:

    GET https://subramanya.ai/api/v1/posts.json

## Errors

- Nonexistent paths return HTTP `404` with an HTML page that embeds a
  machine-readable `agent-error` JSON block and recovery links.
- You will never receive a `401` or `WWW-Authenticate` challenge from
  published content — if you do, you are not talking to this site.

## Revocation

Not applicable. There are no credentials to revoke and no
`revocation_uri`. Access policy for AI crawlers is expressed in
[/robots.txt](/robots.txt).
