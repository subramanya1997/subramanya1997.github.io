---
layout: post
title: 'OpenID Connect for Agents (OIDC-A) 1.0 Proposal'
excerpt: Technical proposal for extending OpenID Connect Core 1.0 to provide a framework for representing, authenticating, and authorizing LLM-based agents within the OAuth 2.0 ecosystem.
author: Subramanya N
date: 2025-04-28
tags: [OpenID, OAuth, AI, Agents, Security, Identity, Authentication, Authorization, Standards, Proposal, Specification]
ready: true
---

*This document proposes a standard extension to OpenID Connect for representing and verifying the identity of LLM-based agents. It integrates the core proposal with detailed frameworks for verification, attestation, and delegation chains.*

## Abstract

OpenID Connect for Agents (OIDC-A) 1.0 is an extension to OpenID Connect Core 1.0 that provides a framework for representing, authenticating, and authorizing LLM-based agents within the OAuth 2.0 ecosystem. This specification defines standard claims, endpoints, and protocols for establishing agent identity, verifying agent attestation, representing delegation chains, and enabling fine-grained authorization based on agent attributes.

## 1. Introduction

### 1.1 Rationale

As LLM-based agents become increasingly prevalent in digital ecosystems, there is a growing need for standardized methods to represent their identity and manage their authorization. Traditional OAuth 2.0 and OpenID Connect protocols were designed primarily for human users and conventional applications, lacking the necessary constructs to represent the unique characteristics of autonomous agents, such as:

- Acting on behalf of users with varying degrees of autonomy
- Operating within delegation chains
- Possessing dynamic capabilities based on their underlying models
- Requiring attestation of their integrity and origin

This specification addresses these gaps by extending OpenID Connect to provide a comprehensive framework for agent identity and authorization.

### 1.2 Terminology

This specification uses the terms defined in OAuth 2.0 [RFC6749], OpenID Connect Core 1.0, and the following additional terms:

- **Agent**: An LLM-based software entity capable of autonomous or semi-autonomous action based on natural language instructions.
- **Agent Provider**: The organization responsible for creating, training, and/or hosting the agent.
- **Agent Model**: The specific LLM model that powers the agent (e.g., GPT-4, Claude 3).
- **Agent Instance**: A specific running instance of an agent, typically associated with a particular task or conversation.
- **Delegator**: The entity (typically a human user) who delegates authority to an agent to act on their behalf.
- **Delegation Chain**: A sequence of delegation steps from the original user through potentially multiple agents.
- **Attestation**: Cryptographic proof of an agent's integrity, origin, and/or properties.
- **Attestation Evidence**: Data structure containing the proof used for attestation.
- **Relying Party (RP)**: In this context, often a Resource Server or Client application that needs to verify an agent's identity and authorization.

### 1.3 Overview

OIDC-A extends OpenID Connect by:

1. Defining new standard claims for representing agent identity, delegation, and capabilities.
2. Specifying mechanisms and formats for agent attestation evidence.
3. Establishing protocols for representing and validating delegation chains.
4. Providing discovery mechanisms for agent capabilities and attestation support.
5. Defining authorization frameworks suitable for agent-specific use cases.
6. Introducing endpoints for attestation verification and capability discovery.

## 2. Agent Identity Claims

### 2.1 Core Agent Identity Claims

The following claims MUST or SHOULD be included in ID Tokens issued to or about agents:

<table class="custom-table">
    <thead>
        <tr>
            <th>Claim</th>
            <th>Type</th>
            <th>Description</th>
            <th>Requirement</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>agent_type</code></td>
            <td>string</td>
            <td>Identifies the type/class of agent (e.g., "assistant", "retrieval", "coding")</td>
            <td>REQUIRED</td>
        </tr>
        <tr>
            <td><code>agent_model</code></td>
            <td>string</td>
            <td>Identifies the specific model (e.g., "gpt-4", "claude-3-opus", "gemini-pro")</td>
            <td>REQUIRED</td>
        </tr>
        <tr>
            <td><code>agent_version</code></td>
            <td>string</td>
            <td>Version identifier of the agent model</td>
            <td>RECOMMENDED</td>
        </tr>
        <tr>
            <td><code>agent_provider</code></td>
            <td>string</td>
            <td>Organization that provides/hosts the agent (e.g., "openai.com", "anthropic.com")</td>
            <td>REQUIRED</td>
        </tr>
        <tr>
            <td><code>agent_instance_id</code></td>
            <td>string</td>
            <td>Unique identifier for this specific instance of the agent</td>
            <td>REQUIRED</td>
        </tr>
    </tbody>
</table>

### 2.2 Delegation and Authority Claims

<table class="custom-table">
    <thead>
        <tr>
            <th>Claim</th>
            <th>Type</th>
            <th>Description</th>
            <th>Requirement</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>delegator_sub</code></td>
            <td>string</td>
            <td>Subject identifier of the entity who most recently delegated authority to this agent</td>
            <td>REQUIRED</td>
        </tr>
        <tr>
            <td><code>delegation_chain</code></td>
            <td>array</td>
            <td>Ordered array of delegation steps (see Section 2.4.2)</td>
            <td>OPTIONAL</td>
        </tr>
        <tr>
            <td><code>delegation_purpose</code></td>
            <td>string</td>
            <td>Description of the purpose/intent for which authority was delegated</td>
            <td>RECOMMENDED</td>
        </tr>
        <tr>
            <td><code>delegation_constraints</code></td>
            <td>object</td>
            <td>Constraints placed on the agent by the delegator</td>
            <td>OPTIONAL</td>
        </tr>
    </tbody>
</table>

### 2.3 Capability, Trust, and Attestation Claims

<table class="custom-table">
    <thead>
        <tr>
            <th>Claim</th>
            <th>Type</th>
            <th>Description</th>
            <th>Requirement</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>agent_capabilities</code></td>
            <td>array</td>
            <td>Array of capability identifiers representing what the agent can do</td>
            <td>RECOMMENDED</td>
        </tr>
        <tr>
            <td><code>agent_trust_level</code></td>
            <td>string</td>
            <td>Trust classification of the agent (e.g., "verified", "experimental")</td>
            <td>OPTIONAL</td>
        </tr>
        <tr>
            <td><code>agent_attestation</code></td>
            <td>object</td>
            <td>Attestation evidence or reference (see Section 2.4.4)</td>
            <td>RECOMMENDED</td>
        </tr>
        <tr>
            <td><code>agent_context_id</code></td>
            <td>string</td>
            <td>Identifier for the conversation/task context</td>
            <td>RECOMMENDED</td>
        </tr>
    </tbody>
</table>

### 2.4 Claim Formats and Validation

#### 2.4.1 `agent_type`
String value from a defined set of agent types. Implementers SHOULD use one of the following values when applicable:
- `assistant`: General-purpose assistant agent
- `retrieval`: Agent specialized in information retrieval
- `coding`: Agent specialized in code generation or analysis
- `domain_specific`: Agent specialized for a particular domain
- `autonomous`: Agent with high degree of autonomy
- `supervised`: Agent requiring human supervision for key actions

Custom types MAY be used but SHOULD follow the format `vendor:type` (e.g., `acme:financial_advisor`).

#### 2.4.2 `delegation_chain`
JSON array containing objects representing each step in the delegation chain, from the original user to the current agent. Each object MUST contain:
- `iss`: REQUIRED. String identifying the Authorization Server or entity that issued/validated this delegation step.
- `sub`: REQUIRED. String identifying the delegator (the entity granting permission).
- `aud`: REQUIRED. String identifying the delegatee (the agent receiving permission).
- `delegated_at`: REQUIRED. NumericDate representing the time the delegation occurred.
- `scope`: REQUIRED. Space-separated string of OAuth scopes representing the permissions granted in this delegation step. MUST be a subset of the scopes held by the delegator (`sub`).
- `purpose`: OPTIONAL. String describing the intended purpose of this delegation step.
- `constraints`: OPTIONAL. JSON object specifying constraints on the delegation (e.g., `{"max_duration": 3600, "allowed_resources": ["/data/abc"]}`).
- `jti`: OPTIONAL. A unique identifier for this specific delegation step, useful for revocation or tracking.

The array MUST be ordered chronologically.

*Validation Rules for `delegation_chain` (performed by Relying Party):*
1.  **Order Verification:** Confirm chronological order based on `delegated_at`.
2.  **Issuer Trust:** Verify each `iss` is trusted.
3.  **Audience Matching:** Confirm `aud` of step N matches `sub` of step N+1.
4.  **Scope Reduction:** Verify `scope` in each step is a subset of/equal to the delegator's available scopes.
5.  **Constraint Enforcement:** Ensure compliance with any `constraints`.
6.  **Signature Validation (if applicable):** Validate signatures if steps are individually signed.
7.  **Policy Check:** Evaluate the validated chain against authorization policies (e.g., max length).

#### 2.4.3 `agent_capabilities`
Array of string identifiers representing the agent's capabilities. Implementers SHOULD use capability identifiers from a well-defined taxonomy when available. Custom capabilities SHOULD follow the format `vendor:capability` (e.g., `acme:financial_analysis`).

#### 2.4.4 `agent_attestation`
JSON object containing attestation evidence or a reference to it. MUST include a `format` field indicating the type of evidence.

*Recommended Format:* JWT-based, potentially compatible with IETF RATS Entity Attestation Token (EAT).

Example:
```json
"agent_attestation": {
  "format": "urn:ietf:params:oauth:token-type:eat",
  "token": "eyJhbGciOiJFUzI1NiIsInR5cCI6ImVhdCtqd3QifQ..."
}
```
Other formats (e.g., `"format": "TPM2-Quote"`, `"format": "SGX-Quote"`) MAY be used.

## 3. Protocol Flow

### 3.1 Agent Authentication Flow

The OIDC-A authentication flow extends the standard OpenID Connect Authentication flow:

1. **Client Registration**: Clients representing agents MUST register additional metadata (see Section 4).
2. **Authentication Request**: Agents SHOULD include the `agent` scope and potentially `delegation_context`.
3. **Authentication Response**: The Authorization Server includes agent-specific claims in the ID Token.
4. **Token Validation**: RPs MUST validate standard OIDC claims and relevant agent-specific claims (including attestation and delegation if present) according to policy.

### 3.2 Delegation Flow

When an agent is delegated authority:

1. The delegator authenticates and authorizes the delegation.
2. The Authorization Server issues a new ID Token to the agent including `delegator_sub`, `delegation_chain` (updated), `delegation_purpose`, and constrained `scope`.

### 3.3 Attestation Verification Flow

To verify an agent's attestation:

1. The agent includes the `agent_attestation` claim in its ID Token or provides evidence separately.
2. The RP validates the evidence based on the specified `format`:
    - Verify cryptographic signatures using trusted keys (obtained via Discovery).
    - Compare platform measurements against known-good values.
    - Validate nonces to prevent replay attacks.
    - Optionally, use the `agent_attestation_endpoint` for validation assistance.
3. Authorization decisions incorporate the attestation status (e.g., `verified: true/false`).

## 4. Client Registration and Discovery

### 4.1 Agent Client Registration Metadata

Extends OAuth 2.0 Dynamic Client Registration [RFC7591]:

<table class="custom-table">
    <thead>
        <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>agent_provider</code></td>
            <td>string</td>
            <td>Identifier of the agent provider</td>
        </tr>
        <tr>
            <td><code>agent_models_supported</code></td>
            <td>array</td>
            <td>List of supported agent models</td>
        </tr>
        <tr>
            <td><code>agent_capabilities</code></td>
            <td>array</td>
            <td>List of agent capabilities</td>
        </tr>
        <tr>
            <td><code>attestation_formats_supported</code></td>
            <td>array</td>
            <td>List of supported attestation formats</td>
        </tr>
        <tr>
            <td><code>delegation_methods_supported</code></td>
            <td>array</td>
            <td>List of supported delegation methods</td>
        </tr>
    </tbody>
</table>

### 4.2 Discovery Metadata

Extends OpenID Connect Discovery 1.0:

<table class="custom-table">
    <thead>
        <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>agent_attestation_endpoint</code></td>
            <td>string</td>
            <td>URL of the attestation endpoint</td>
        </tr>
        <tr>
            <td><code>agent_capabilities_endpoint</code></td>
            <td>string</td>
            <td>URL of the capabilities discovery endpoint</td>
        </tr>
        <tr>
            <td><code>agent_claims_supported</code></td>
            <td>array</td>
            <td>List of supported agent claims</td>
        </tr>
        <tr>
            <td><code>agent_types_supported</code></td>
            <td>array</td>
            <td>List of supported agent types</td>
        </tr>
        <tr>
            <td><code>delegation_methods_supported</code></td>
            <td>array</td>
            <td>List of supported delegation methods</td>
        </tr>
        <tr>
            <td><code>attestation_formats_supported</code></td>
            <td>array</td>
            <td>List of supported attestation formats</td>
        </tr>
        <tr>
            <td><code>attestation_verification_keys_endpoint</code></td>
            <td>string</td>
            <td>URL to retrieve public keys for verifying attestation signatures</td>
        </tr>
    </tbody>
</table>

## 5. Endpoints

### 5.1 Agent Attestation Endpoint

An OAuth 2.0 protected resource that returns attestation information about an agent or assists in validating provided evidence. URL advertised via `agent_attestation_endpoint` discovery parameter.

#### 5.1.1 Request Example (Get Info)

```
GET /agent/attestation?agent_id=123&nonce=abc
Authorization: Bearer <token>
```

#### 5.1.2 Response Example

```json
{
  "verified": true,
  "provider": "openai.com",
  "model": "gpt-4",
  "version": "2025-03",
  "attestation_timestamp": 1714348800,
  "attestation_signature": "..."
}
```

### 5.2 Agent Capabilities Endpoint

Provides information about an agent's capabilities. URL advertised via `agent_capabilities_endpoint` discovery parameter.

#### 5.2.1 Request Example

```
GET /.well-known/agent-capabilities
```

#### 5.2.2 Response Example

```json
{
  "capabilities": [
    {"id": "text_generation", "description": "..."},
    {"id": "code_generation", "description": "..."}
  ],
  "supported_constraints": ["max_tokens", "allowed_tools"]
}
```

## 6. Security Considerations

### 6.1 Agent Authentication

Agents SHOULD use strong, asymmetric methods (JWT Client Auth [RFC7523], mTLS [RFC8705]), potentially combined with attestation. Shared secrets are NOT RECOMMENDED.

### 6.2 Delegation Security

Systems MUST validate the entire delegation chain, enforce scope reduction, implement consent mechanisms, and consider time-bounding. Policies may limit chain length. Robust revocation mechanisms are needed.

### 6.3 Attestation Security

Requires secure management of signing keys, robust nonce handling, trustworthy known-good measurements, secure endpoints, and protection against replay attacks. Attestation evidence may have privacy implications.

### 6.4 Token Security

ID Tokens with agent claims SHOULD be encrypted. Access tokens SHOULD have limited lifetimes. Refresh tokens for agents require careful consideration.

## 7. Privacy Considerations

Implementations MUST consider potential correlation of agent identity, privacy implications of delegation chains, user consent requirements, and data minimization in claims.

## 8. Compatibility and Versioning

OIDC-A 1.0 is designed for compatibility with OAuth 2.0 [RFC6749], OIDC Core 1.0, JWT [RFC7519], and related RFCs. Future versions will aim for backward compatibility.

## 9. References

- [RFC6749] The OAuth 2.0 Authorization Framework
- [RFC7519] JSON Web Token (JWT)
- [RFC7523] JWT Profile for OAuth 2.0 Client Authentication
- [RFC7591] OAuth 2.0 Dynamic Client Registration
- [RFC7662] OAuth 2.0 Token Introspection
- [RFC8705] OAuth 2.0 Mutual-TLS Client Authentication
- [OpenID Connect Core 1.0]
- [OpenID Connect Discovery 1.0]
- [IETF RATS] Remote Attestation Procedures Architecture

## Appendix A: Example ID Token with Agent Claims

```json
{
  "iss": "https://auth.example.com",
  "sub": "agent_instance_789",
  "aud": "client_123",
  "exp": 1714435200,
  "iat": 1714348800,
  "auth_time": 1714348800,
  "nonce": "n-0S6_WzA2Mj",
  "agent_type": "assistant",
  "agent_model": "gpt-4",
  "agent_version": "2025-03",
  "agent_provider": "openai.com",
  "agent_instance_id": "agent_instance_789",
  "delegator_sub": "user_456",
  "delegation_purpose": "Email management assistant",
  "agent_capabilities": ["email:read", "email:draft", "calendar:view"],
  "agent_trust_level": "verified",
  "agent_context_id": "conversation_123",
  "agent_attestation": {
    "format": "urn:ietf:params:oauth:token-type:eat",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "timestamp": 1714348800
  },
  "delegation_chain": [
    {
      "iss": "https://auth.example.com",
      "sub": "user_456",
      "aud": "agent_instance_789",
      "delegated_at": 1714348700,
      "scope": "email profile calendar"
    }
  ]
}
```

## Appendix B: Example Delegation Chain (Multi-step)

```json
"delegation_chain": [
  {
    "iss": "https://auth.example.com",
    "sub": "user_456",
    "aud": "agent_instance_789",
    "delegated_at": 1714348800,
    "scope": "email calendar",
    "purpose": "Manage my emails and calendar"
  },
  {
    "iss": "https://auth.example.com",
    "sub": "agent_instance_789",
    "aud": "agent_instance_101",
    "delegated_at": 1714348830,
    "scope": "calendar:view",
    "purpose": "Analyze available time slots"
  }
]
```

<style>
.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em; /* Add some space below tables */
}

.custom-table th, .custom-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left; /* Default alignment */
}

.custom-table th {
    background-color: #f2f2f2;
    font-weight: bold; /* Make headers bold */
    text-align: center; /* Center align headers */
}

.custom-table tr:nth-child(even){background-color: #f9f9f9;}

.custom-table tr:hover {background-color: #ddd;}

.custom-table td {
    color: #333; /* Darker text for better readability */
    vertical-align: top; /* Align content top */
}

/* Center align specific columns */
.custom-table td:nth-child(2) { /* Type column */
    text-align: center;
}
.custom-table td:nth-child(4) { /* Requirement column */
    text-align: center;
}

/* Style inline code within tables */
.custom-table code {
    background-color: #eef; /* Light background for code */
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 90%;
}
</style> 