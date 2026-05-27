# 🏊‍♂️ SwimTO — Project Strategy & Business Model

**Version:** 3.0  
**Last Updated:** May 26, 2026  
**Status:** Open Source Project - MIT Licensed

---

## 📋 Executive Summary

SwimTO is an **open-source web application** that provides Toronto residents with reliable, up-to-date indoor pool drop-in swim schedules. The app aggregates data from the City of Toronto Open Data Portal and presents it in an intuitive, mobile-first interface.

---

## 🎯 Project Model

### Open Source Strategy

**Why Open Source:**
- **Community Value:** Pool schedules are public data — the tool should be too
- **Service Model:** Value is in the hosted, maintained service at swimto.eldertree.xyz
- **Trust & Transparency:** Open code builds credibility for civic tech
- **Educational:** Share patterns for data aggregation and self-hosting
- **Discoverability:** AI tools (Claude Code, Cursor, etc.) can learn from the codebase

**Monetization (Optional Future):**
- Hosted service remains free for Toronto
- Potential "SwimTO Pro" for other cities (Ottawa, Montreal, Vancouver)
- White-label deployments for other municipalities
- Sponsorships from community organizations

### Distribution Channels

1. **Self-Hosted Production**
   - Primary instance: https://swimto.eldertree.xyz
   - Free for all Toronto residents
   - No ads, no tracking, no payment required

2. **QR Codes at Facilities**
   - Place QR codes at participating Toronto community pools
   - Direct link to free web app
   - Simple user journey: Scan → Use

3. **Open Source Community**
   - GitHub repository for contributions
   - Other cities can fork and deploy
   - Community-driven improvements

---

## 💡 Value Proposition

### What Users Get (Free):

✅ **Reliable Data**
- Daily updates from official City of Toronto sources
- Same data powering toronto.ca website
- 100% accurate swim schedules

✅ **Superior User Experience**
- Mobile-first, responsive design
- Interactive map showing all lane swim locations
- Calendar view with easy filtering by day/time
- PWA support (installable on mobile devices)

✅ **Privacy & Trust**
- Self-hosted infrastructure
- No user tracking or analytics
- No ads or third-party integrations
- Open about data sources

✅ **Local Support**
- Supporting local Toronto developer
- Continued maintenance and improvements
- Direct user support

---

## 🔒 Repository & Licensing Strategy

### Repository Status

**Current:** PUBLIC GitHub repository (MIT Licensed)
- Open for contributions and community improvements
- Transparent development process
- Forkable for other cities/use cases
- Indexed by AI coding tools (TomeVault, Cursor rules, etc.)

### Licensing Approach

**MIT License:**

- Free to use, modify, and distribute
- Commercial use allowed
- Attribution required (copyright notice)
- No warranty (standard for open source)

**Rationale:**
- **Civic tech should be open:** Pool schedules are public data
- **Service value > code value:** Hosted instance is the product, not the codebase
- **Community-driven improvement:** Contributors can help maintain scrapers as pool sites change
- **Educational value:** Share self-hosting and data aggregation patterns
- **Trust & credibility:** Open source builds trust for public-data aggregation
- **AI tool discoverability:** TomeVault and similar tools can index CLAUDE.md for better developer experience

### What Remains Proprietary

- **swimto.eldertree.xyz domain and branding**
- **Operational infrastructure** (K8s configs, secrets, deployment pipelines)
- **Future "SwimTO Pro"** commercial features (if developed)

---

## 📊 Market Analysis

### Target Users

**Primary:**
- Toronto residents who swim regularly
- Fitness enthusiasts seeking lane swim times
- Adults with flexible schedules (remote workers, retirees)

**Secondary:**
- Parents coordinating children's activities
- Tourists visiting Toronto
- Health professionals recommending swimming

### Market Size

- Toronto Population: 2.9M+
- Community Pools with Lane Swim: ~50 facilities
- Regular Swimmers (estimated): 100K+
- Addressable Market: 10K-50K users

### Competitive Landscape

**Current Solutions:**
1. **toronto.ca website**
   - Official but clunky interface
   - Not mobile-optimized
   - Requires multiple clicks to find schedules

2. **Individual facility websites**
   - Scattered information
   - Inconsistent formats
   - Time-consuming to check multiple pools

3. **Generic calendar apps**
   - Manual data entry required
   - No automation
   - Maintenance burden on users

**SwimTO Advantage:**
- Aggregates all data in one place
- Mobile-optimized interface
- Automatic updates
- Interactive map visualization
- Superior UX
- **Open source** — forkable for other cities/use cases

---

## 🚀 Go-to-Market Strategy

### Phase 1: Soft Launch (Months 1-3)

**Goals:**
- Deploy to production (Raspberry Pi k3s)
- Test with friends/family (beta testers)
- Refine user experience based on feedback
- Set up payment processing infrastructure

**Activities:**
- [ ] Deploy production infrastructure
- [ ] Implement payment flow (Stripe/Apple Pay/Google Pay)
- [ ] Create QR code landing page
- [ ] Beta test with 10-20 users
- [ ] Gather feedback and iterate

### Phase 2: Local Launch (Months 4-6)

**Goals:**
- Launch to Toronto swimming community
- Place QR codes at 5-10 facilities
- Reach 100+ paying users
- Establish positive reviews/word-of-mouth

**Activities:**
- [ ] Contact community centers for QR code placement
- [ ] Create marketing materials (flyers, posters)
- [ ] Engage with local swimming groups on social media
- [ ] Monitor user feedback and fix issues quickly
- [ ] Implement basic analytics (privacy-respecting)

### Phase 3: Growth & Scaling (Months 7-12)

**Goals:**
- Scale to 500+ users
- Expand QR code presence to all major pools
- Consider app store distribution
- Evaluate feature requests

**Activities:**
- [ ] Expand QR code distribution network
- [ ] Explore Apple App Store listing
- [ ] Explore Google Play Store listing
- [ ] Implement requested features
- [ ] Consider open-source strategy reassessment

---

## 💰 Cost Structure & Sustainability

### Infrastructure Costs (Year 1)

**Current Self-Hosted Setup:**
- Raspberry Pi hardware: $200 (one-time, already owned)
- Electricity: ~$5/month ($60/year)
- Domain name: $15/year
- **Total Annual Cost: ~$75/year**

**Development:**
- Self-funded personal project
- Time investment: ~5-10 hours/month maintenance
- Community contributions (future)

**Distribution:**
- QR code printing: $50-100 (one-time)
- No payment processing fees (free service)
- No app store fees (web app)

### Sustainability Model

**Primary Goal:** Free civic tech for Toronto residents

**Potential Future Revenue (Optional):**
- "SwimTO Pro" for other cities ($5-10/month per municipality)
- White-label deployments for municipalities
- Sponsorships from community organizations
- Donations/GitHub Sponsors

**Current Status:** Self-funded passion project with minimal operating costs

---

## 🔐 Legal & Compliance

### Data & Privacy

**Approach:**
- No user data collection beyond payment
- No tracking or analytics (or minimal, privacy-respecting)
- All data sourced from public City of Toronto resources
- Compliance with Canadian privacy laws (PIPEDA)

**Data License:**
- City of Toronto data under Open Government Licence – Toronto
- Proper attribution in app and documentation

### Intellectual Property

**Protection:**
- Source code copyright: Rafael Oliveira
- Consider trademark for "SwimTO" name
- Logo/branding copyright
- Keep repository private

**User Terms:**
- Clear terms of service
- One-time purchase, no refunds
- No warranty (as-is)
- Right to discontinue service

---

## 📈 Success Metrics

### Key Performance Indicators (KPIs)

**Growth:**
- Number of active users
- Community contributions (PRs, issues)
- Other cities deploying forks
- GitHub stars/engagement

**Product:**
- Daily active users
- User retention rate
- Data freshness/accuracy
- App performance metrics

**User Satisfaction:**
- User feedback/reviews
- Support requests
- Feature requests
- Churn rate

---

## 🎯 Core Principles

**1. Privacy-First**
- No tracking, no ads, no data selling
- User privacy is non-negotiable
- Transparent about data usage

**2. Quality-Focused**
- Reliable data sources
- Fast, responsive performance
- Great user experience
- Regular maintenance

**3. Self-Hosted**
- Complete infrastructure control
- No dependence on cloud providers
- Cost-effective long-term
- Educational value

**4. Commercial Viability**
- Fair pricing for value provided
- Sustainable business model
- Support ongoing development
- Enable future improvements

**5. Local Value**
- Serving Toronto community
- Supporting local development
- Contributing to open data ecosystem
- Partnership with community centers

**6. Open Source by Default**
- Civic tech should be publicly accessible
- Community contributions improve the product
- Transparency builds trust
- Educational value for other developers

---

## 🔮 Future Roadmap

### Short Term (3-6 months)
- [x] Open-source under MIT License
- [ ] QR code distribution network
- [ ] User feedback mechanism
- [ ] Basic analytics implementation (privacy-respecting)
- [ ] Community contribution guidelines

### Medium Term (6-12 months)
- [ ] PWA improvements (offline mode, install prompts)
- [ ] User accounts (optional, for favorites)
- [ ] Favorite facilities feature
- [ ] Schedule change notifications
- [ ] Expand to more facility types (arenas, tennis, etc.)
- [ ] Community contributions and PRs

### Long Term (12+ months)
- [ ] Expand to other cities (Ottawa, Montreal, Vancouver)
- [ ] Partnerships with swimming organizations
- [ ] API access for third parties
- [ ] Community contribution model
- [ ] Open-source core components

---

## 📞 Contact & Support

**Developer:** Rafael Oliveira  
**Project:** SwimTO  
**Repository:** Private (GitHub)  
**Website:** TBD  
**Support:** TBD

---

## 📝 Change Log

- **v3.0** (May 26, 2026): Open-sourced under MIT License, shifted to free service model
- **v2.0** (Nov 5, 2025): Updated proprietary commercial strategy
- **v1.0** (Nov 5, 2025): Initial strategy document - proprietary commercial project

---

**Note:** This document is public as part of the open-source repository.

