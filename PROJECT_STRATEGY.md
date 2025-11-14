# 🏊‍♂️ SwimTO — Project Strategy & Business Model

**Version:** 2.0  
**Last Updated:** November 5, 2025  
**Status:** Commercial Product - Private Repository

---

## 📋 Executive Summary

SwimTO is a **commercial mobile application** that provides Toronto residents with reliable, up-to-date indoor pool drop-in swim schedules. The app aggregates data from the City of Toronto Open Data Portal and presents it in an intuitive, mobile-first interface.

---

## 🎯 Business Model

### Revenue Model

**Monetization Strategy:**
- **Price:** $0.99 one-time purchase
- **No subscriptions:** One-time payment for lifetime access
- **No ads:** Clean, focused user experience
- **No tracking:** Privacy-first approach respects user data

### Distribution Channels

1. **QR Codes at Facilities**
   - Place QR codes at participating Toronto community pools
   - Direct link to purchase/download page
   - Simple user journey: Scan → Purchase → Use

2. **App Stores** (Future)
   - Apple App Store (iOS)
   - Google Play Store (Android)
   - Standard app store monetization

3. **Word of Mouth**
   - Organic growth through user recommendations
   - Community center partnerships
   - Local swimming groups and clubs

---

## 💡 Value Proposition

### What Users Get for $0.99:

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

**Current:** PRIVATE GitHub repository
- Protects intellectual property
- Controls access to codebase
- Prevents unauthorized distribution
- Enables commercial development

### Licensing Approach

**Fully Proprietary:**

- All code under proprietary license from inception
- Commercial use only with explicit permission
- All rights reserved by Rafael Oliveira
- No open-source release planned for initial versions

**Rationale:**
- Built as commercial product from day one
- Protects intellectual property
- Enables sustainable business model
- Provides flexibility for future licensing decisions

### Future Open Source Considerations

**Possible Future Options:**

1. **Open Source Components**
   - May open-source specific libraries/tools
   - Core app remains proprietary
   - Contribute back to community selectively

2. **Source Available**
   - Make source code viewable (not forkable)
   - Transparency without losing IP
   - Similar to many commercial apps

3. **Remain Fully Proprietary**
   - Most likely path for sustainability
   - Standard for commercial mobile apps
   - Protects competitive advantage

**Decision Point:** Evaluate after establishing user base and revenue (12+ months)

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

## 💰 Financial Projections

### Revenue Scenarios (Year 1)

**Conservative:**
- 500 users × $0.99 = $495

**Moderate:**
- 2,000 users × $0.99 = $1,980

**Optimistic:**
- 5,000 users × $0.99 = $4,950

### Cost Structure

**Infrastructure:**
- Raspberry Pi hardware: $200 (one-time)
- Electricity: ~$5/month
- Domain name: $15/year
- Total: ~$275/year

**Development:**
- Self-funded (personal project)
- Time investment: ~5-10 hours/month maintenance
- Major updates: As needed

**Distribution:**
- Payment processing fees: ~3% of revenue
- QR code printing: $50-100 (one-time)
- App store fees: $99/year (Apple) + $25 (Google, one-time)

**Net Margin:** ~85-90% after costs

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

**Financial:**
- Number of paying users
- Revenue (monthly/yearly)
- Customer acquisition cost
- Net margin

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

---

## 🔮 Future Roadmap

### Short Term (3-6 months)
- [ ] Complete payment integration
- [ ] QR code distribution network
- [ ] User feedback mechanism
- [ ] Basic analytics implementation

### Medium Term (6-12 months)
- [ ] App store distribution
- [ ] User accounts (optional)
- [ ] Favorite facilities feature
- [ ] Push notifications for schedule changes
- [ ] Expand to more facility types

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

- **v1.0** (Nov 5, 2025): Initial strategy document - proprietary commercial project

---

**Note:** This document is confidential and intended for internal use and potential investors/partners only.

