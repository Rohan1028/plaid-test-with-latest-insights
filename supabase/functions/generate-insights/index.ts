// supabase/functions/generate-insights/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT2')!;
const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_KEY')!;
const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')!;
const PLAID_SECRET = Deno.env.get('PLAID_SECRET')!;
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';
const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};
const PLAID_BASE_URL = PLAID_BASE_URLS[PLAID_ENV] || PLAID_BASE_URLS['production'];

// Complete insight definitions (from Financial Insights - Incluya.txt)
const INSIGHT_DEFINITIONS = `
Financial Insights - Incluya

For the beta launch, we can focus on Wins-amplifier, Shame Language Detector, Reality vs. Perception Gap, Family Pattern Acknowledgement (og Pattern Breaking Success).
Consistent Usage Celebration (streak) - activities/check-in page
 Why:
Can be accomplished through intake question + Plaid data without need for long-term chat data
Gently integrates emotional experiences with data contexts
Are trauma-informed and can help build trust with the user early in the experience
**for Family Pattern Acknowledgement we can restructure Pattern Breaking Success to be more simple, only focused on what family contexts came up during intake and not long-term pattern changes

Wins Amplifier

Why: This builds user confidence and immediately disrupts shame cycles. It can be triggered from even small Plaid data (e.g. regular payments, small savings deposits) and linked back to intake signals about fear or self-judgment.

How it connects to intake:
"I feel bad spending money on myself" → Recognize thoughtful purchases
"I pay bills last minute" → Highlight any on-time bill behavior
"I shop at three stores for the best deals" → Validate resourcefulness

Plaid data needed:
On-time payments
Savings/deposits
Small repeat purchases
(?) Budget stretching patterns (setting an average baseline in comparison)

Example Insight Display:
"You've been consistently saving for a few weeks now. That's a habit worth noticing."
Basic Wins Amplifier
When: Any positive financial behavior mentioned
User Input Example: "I paid all my bills this month but I'm still stressed about money"
Screen Display: "You're better with money than you realize"
Supporting Detail: "I noticed you [specific positive behavior] - that shows real financial awareness"
Micro-Progress Celebrator
When: Small positive changes (saved $10, checked account, paid bill early)
User Input Example: "I managed to put $25 in savings this week, but it's not much"
Screen Display: "Small steps like this actually build into big financial wins"
Supporting Detail: "Your $[amount] progress this week might seem small, but consistency creates lasting change"
Survival Skills Validator
When: User mentions stretching money, finding deals, managing on tight budget
User Input Example: "I shop at three different stores to get the best prices and use every coupon I can find. It's exhausting."
Screen Display: "You've developed real financial survival skills"
Supporting Detail: "Finding deals, stretching budgets, making tough choices - that's expertise many people don't have"
Consistency Recognizer
When: Any repeated positive behavior (3+ times)
User Input Example: "I've been checking my account every morning for two weeks now, just trying to stay on top of things"
Screen Display: "You're building a solid money habit here"
Supporting Detail: "I've noticed you [specific behavior] consistently - habits like this compound over time"
Hidden Strength Spotter
When: User dismisses their own positive behavior
User Input Example: "I guess I got lucky and didn't overspend this month, but it probably won't happen again"
Screen Display: "You just described good financial judgment"
Supporting Detail: "You're calling it luck, but I see smart decision-making and financial awareness"

Shame Language Detector

Why: Even without chat analysis, we can create tags about user based on intake language (especially around guilt, fear, embarrassment) and serve preemptive insights when spending data is neutral or normal but might still feel scary or stressful.

How it connects to intake:
"I hold back from sharing financial worries" → Gentle reassurance when any negative pattern emerges
"I feel bad spending money on myself" → Normalize self-investment
"I compare myself to others" → Trigger grounding insight when spending seems elevated but justified

Plaid data needed:
Recent purchases  
Spending categories 

Example Insight Display:
Self-Criticism Interrupter
When: "I'm bad/stupid/terrible with money"
User Input Example: "I'm such an idiot with money. I can't believe I spent $40 on takeout this week"
Screen Display: "You're being harsh on yourself"
Supporting Detail: "Managing money is genuinely hard for most people - you're not alone in finding it challenging"
Perfectionism Deflator
When: "I should know better," "I should be further along"
User Input Example: "I'm 35 and should have way more saved by now. My friends all seem to have their shit together financially"
Screen Display: "There's no perfect timeline for financial progress"
Supporting Detail: "Everyone moves at their own pace - comparing your behind-the-scenes to others' highlight reel isn't fair to you"
Comparison Trap Catcher
When: Comparing self negatively to others
User Input Example: "My coworker just bought a house and I'm still living paycheck to paycheck. What's wrong with me?"
Screen Display: "Everyone's financial journey looks different"
Supporting Detail: "You're seeing their highlight reel, not their struggles, setbacks, or starting point"
Catastrophic Thinking Calmer
When: "I'll never," "I always," extreme language
User Input Example: "I'll never be able to buy a house. I always mess up my finances just when things start getting better"
Screen Display: "That sounds overwhelming - let's focus on right now"
Supporting Detail: "When everything feels impossible, looking at what's actually happening today can help"
Family Script Challenger
When: Repeating negative family money messages
User Input Example: "Money doesn't grow on trees, and people like us don't get to have nice things. That's what my mom always said and she was right"
Screen Display: "That voice sounds like it came from somewhere else"
Supporting Detail: "What do YOU think about your money situation, separate from what you were taught?"

Reality vs. Perception Gap

Why: Intake answers often suggest distorted self-perception (e.g. "I'm bad with money," "I can't save"). Plaid data can gently show the truth is less catastrophic than users fear.

How it connects to intake:
"I always pay bills late" → but Plaid shows most bills are on time
"I can't save" → but Plaid shows small auto-saves or cash flow wiggle room
"I grew up fearing money" → and now they're managing despite that fear

Plaid data needed:
Bill payment history
Savings flow
Spending category consistency

Examples: 
Positive Reality Revealer
When: Self-assessment worse than actual data
User Input Example: "I'm terrible at saving money" + user has been consistently saving $100/month for 6 months
Screen Display: "You're actually doing better than you think"
Supporting Detail: "Based on what you've shared, your financial reality is more positive than how you're describing it"
Progress Tracker
When: "I'm not making progress" but data shows improvement
User Input Example: "I feel like I'm going nowhere with my debt" + credit card balance decreased from $5000 to $3500 in 4 months
Screen Display: "You've actually improved more than you realize"
Supporting Detail: "In [timeframe], you've made progress in [specific area] - that's real movement forward"
Skills Inventory
When: "I don't know anything about money" but demonstrates knowledge
User Input Example: "I don't understand money at all, but I know I should pay off my high-interest credit card before putting money in a low-yield savings account"
Screen Display: "You know more about money than you're giving yourself credit for"
Supporting Detail: "You just demonstrated solid financial reasoning - that knowledge came from somewhere"
Capability Reminder
When: "I can't handle money" but evidence shows they can
User Input Example: "I can't handle money at all" + never missed a rent payment, utilities always on, feeds family of 4 on $300/month
Screen Display: "You're managing your money more successfully than you think"
Supporting Detail: "Looking at [specific examples], you're handling financial responsibilities that require real capability"
Strength Reflection
When: Focus only on problems, ignore strengths
User Input Example: "Everything is falling apart financially. My car needs repairs, my credit card is maxed out, and I have no emergency fund" + user has stable job, always makes minimum payments, and is actively seeking solutions
Screen Display: "You're focusing on challenges but missing your strengths"
Supporting Detail: "While dealing with [challenges], you're also [specific positive behaviors] - that balance matters"

Family Pattern Acknowledgement 

Why: Users may describe difficult or dysfunctional family money patterns during intake. If their current Plaid data shows healthier behavior, we can affirm their agency and growth without requiring perfection or long-term habit changes.

How it connects to intake:
"My parents always fought about money" → Plaid shows calm, routine bill payments
"We never had savings growing up" → Plaid shows regular deposits to savings or cash flow margin
"I learned to avoid money" → Plaid shows weekly account reviews or budgeting transactions
"I still follow the same bad habits I saw at home" → but Plaid shows deviation in even small ways (e.g. rent paid on time, subscriptions canceled, etc.)

Plaid data needed:
Recurring payments (especially utilities, rent, subscriptions)
(?) Presence of any savings activity or reduced debt
Consistent cash flow patterning or category shifts over time

Examples:
Pattern Break Acknowledger
When: User describes inherited chaotic or unstable money habits but shows evidence of consistency or intentionality
User Input Example: "We never had any money growing up and everything was unpredictable" + user has consistent bill pay and automated savings
Screen Display: "You're doing things differently than how you were taught"
Supporting Detail: "Even having a system in place—like your recurring payments—shows a shift from that past"

Inherited Belief Reframer
When: User expresses a belief tied to family scripts (e.g. "Money is dangerous," "People like us don't save")
User Input Example: "We were raised to think money was something to be feared" + Plaid shows user has built an emergency fund
Screen Display: "That belief came from somewhere—but you're making new choices now"
Supporting Detail: "Your savings behavior shows you're building a different kind of relationship with money"

Small Shift Spotlight
When: User claims they've repeated family money patterns, but Plaid shows even partial divergence
User Input Example: "I'm just like my dad—I spend without thinking" + Plaid shows user canceled multiple subscriptions last month
Screen Display: "Even a small change counts when you're breaking generational habits"
Supporting Detail: "Canceling those subscriptions is a step they never took—you're already shifting things"

Cycle Interrupt Recognizer
When: User mentions family debt/stress cycles but has begun to reduce or manage differently
User Input Example: "My family always lived on credit" + user's credit card balance has dropped for 3 months straight
Screen Display: "You're interrupting a pattern that took years to form"
Supporting Detail: "That drop in debt might feel small—but it's a big shift from what you saw growing up"

Legacy Rebuilder
When: User expresses a desire to create a different financial legacy than their upbringing
User Input Example: "I want my kids to have more stability than I did" + Plaid shows emergency fund contributions or regular childcare expenses paid
Screen Display: "You're already laying the foundation for something new"
Supporting Detail: "Taking care of [specific expense] shows the kind of foundation you're building for the next generation"

Intake Question Relation

1. "When bills are due, how often do you pay them at the last minute or late?"
Relevant Insights:
Reality vs. Perception Gap → If user says "often," but Plaid shows most bills paid on time
Wins Amplifier → Even if not perfect, highlight success in making payments under pressure
Example Insight:
"Even when it's hard, you've still made those payments. That's something to be proud of."

2. "How often do you hold back from sharing financial worries with others?"
Relevant Insights:
Shame Language Detector → Signals money secrecy, fear of judgment → use gentle reframing
Wins Amplifier → If user later demonstrates vulnerability or self-reflection in app
Example Insight:
"Opening up about money is tough, but being here shows you're already starting to change that story."

3. "How often do you feel bad spending money on yourself, even for things you need?"
Relevant Insights:
Shame Language Detector → Normalize self-investment
Reality vs. Perception Gap → If spending is reasonable and responsible
Wins Amplifier → Celebrate intentionality or balance in self-spending
Example Insight:
"You took care of yourself this week. That's not a failure. It's a kind of strength."

4. "What are some of your dreams or goals when it comes to money?"
Relevant Insights:
Wins Amplifier → Validate any progress, however small, toward that vision
Reality vs. Perception Gap → Provide gentle timelines or progress notes (if data supports)
Example Insight:
"That $50 you saved this month is a quiet step toward that dream you told us about."

5. "As you grew up, how did your parents talk about money?"
Relevant Insights:
Shame Language Detector → Especially if answers reflect inherited fear, guilt, deprivation
Wins Amplifier → When user acts differently from family patterns (resilience)
Family Pattern Acknowledgement → Supports identifying divergence from inherited beliefs
Example Insight:
"You're not just surviving those messages. You're choosing your own approach now."

6. "How often do you find yourself measuring success by what people earn or own?"
Relevant Insights:
Shame Language Detector → Intervene in comparison spiral
Reality vs. Perception Gap → Gently highlight how the user is doing well in their own lane
Example Insight:
"Success isn't a race. You're growing in a way that fits your life."

7. "If you shared one childhood story about money with us, what would it be?"
Relevant Insights:
Shame Language Detector → Many stories include emotional pain, guilt, fear
Wins Amplifier → Point to strengths drawn from early experience
Family Pattern Acknowledgement → Connect memory to current transformation/habits, even if partial
Example Insight:
That experience shaped you—and the way you're showing up now speaks to your strength."

Trigger Words/Phrases to Keep Track Of:

Wins Amplifier
Tracked when users downplay strengths or describe effortful behavior as "nothing."
"It's not a lot but…"
"I guess that's something"
"I'm just trying"
"Barely managing"
"I didn't do enough"
"I don't know if it counts"
"Not sure if that helps"
"I probably should've done more"
"It's just a small thing"
"I wish I'd saved more"
"I'm scraping by"
"Lucky this time"

Shame Language Detector
Tracked when users blame, criticize, or pathologize themselves.
"I'm terrible with money"
"I should know better"
"I always mess this up"
"I'll never figure this out"
"I'm so bad at adulting"
"Why can't I get it right?"
"I feel guilty spending"
"It's embarrassing"
"I'm ashamed"
"I hide this from people"
"Other people have it together"
"I don't deserve [x]
"I don't want to look stupid"
"I don't tell anyone"
"I hate looking at my account"
"I suck at saving"

Reality vs. Perception Gap
Tracked when there's negative self-perception that may not align with data.
"I can't save"
"I always pay late"
"I'm never going to be financially stable"
"I'm not making any progress"
"I don't even know where my money goes"
"I'm bad at tracking things"
"I feel like I'm behind"
"I have no idea what I'm doing"
"I'm a mess with money"
"Nothing's improving"
"I don't get it"
"It's hopeless"

Family Pattern Acknowledgement
Tracked when users reflect on money messages or patterns from their upbringing.
"My parents never talked about money"
"Money was always tight"
"We grew up struggling"
"I was taught to…"
"In my family, we…"
"My parents always fought about money"
"We never had savings"
"That's just how I was raised"
"We lived paycheck to paycheck"
"I still do what I saw growing up"
"I didn't learn good habits"
"They said money was evil/selfish/etc."
"I wasn't allowed to ask for things"
"I copied what my mom/dad did"
"They never planned for anything"

Why: Even without chat analysis, we can create tags about user based on intake language (especially around guilt, fear, embarrassment) and serve preemptive insights when spending data is neutral or normal but might still feel scary or stressful.

How it connects to intake:
-	"I hold back from sharing financial worries" → Gentle reassurance when any negative pattern emerges
-	"I feel bad spending money on myself" → Normalize self-investment
-	"I compare myself to others" → Trigger grounding insight when spending seems elevated but justified

Plaid data needed:
-	Recent purchases  
-	Spending categories 

Example Insight Display:
Self-Criticism Interrupter
●	When: "I'm bad/stupid/terrible with money"
●	User Input Example: "I'm such an idiot with money. I can't believe I spent $40 on takeout this week"
●	Screen Display: "You're being harsh on yourself"
●	Supporting Detail: "Managing money is genuinely hard for most people - you're not alone in finding it challenging"
Perfectionism Deflator
●	When: "I should know better," "I should be further along"
●	User Input Example: "I'm 35 and should have way more saved by now. My friends all seem to have their shit together financially"
●	Screen Display: "There's no perfect timeline for financial progress"
●	Supporting Detail: "Everyone moves at their own pace - comparing your behind-the-scenes to others' highlight reel isn't fair to you"
Comparison Trap Catcher
●	When: Comparing self negatively to others
●	User Input Example: "My coworker just bought a house and I'm still living paycheck to paycheck. What's wrong with me?"
●	Screen Display: "Everyone's financial journey looks different"
●	Supporting Detail: "You're seeing their highlight reel, not their struggles, setbacks, or starting point"
Catastrophic Thinking Calmer
●	When: "I'll never," "I always," extreme language
●	User Input Example: "I'll never be able to buy a house. I always mess up my finances just when things start getting better"
●	Screen Display: "That sounds overwhelming - let's focus on right now"
●	Supporting Detail: "When everything feels impossible, looking at what's actually happening today can help"
Family Script Challenger
●	When: Repeating negative family money messages
●	User Input Example: "Money doesn't grow on trees, and people like us don't get to have nice things. That's what my mom always said and she was right"
●	Screen Display: "That voice sounds like it came from somewhere else"
●	Supporting Detail: "What do YOU think about your money situation, separate from what you were taught?"
________________________________________

Reality vs. Perception Gap

Why: Intake answers often suggest distorted self-perception (e.g. "I'm bad with money," "I can't save"). Plaid data can gently show the truth is less catastrophic than users fear.

How it connects to intake:
-	"I always pay bills late" → but Plaid shows most bills are on time
-	"I can't save" → but Plaid shows small auto-saves or cash flow wiggle room
-	"I grew up fearing money" → and now they're managing despite that fear

Plaid data needed:
-	Bill payment history
-	Savings flow
-	Spending category consistency

Examples: 
Positive Reality Revealer
●	When: Self-assessment worse than actual data
●	User Input Example: "I'm terrible at saving money" + user has been consistently saving $100/month for 6 months
●	Screen Display: "You're actually doing better than you think"
●	Supporting Detail: "Based on what you've shared, your financial reality is more positive than how you're describing it"
Progress Tracker
●	When: "I'm not making progress" but data shows improvement
●	User Input Example: "I feel like I'm going nowhere with my debt" + credit card balance decreased from $5000 to $3500 in 4 months
●	Screen Display: "You've actually improved more than you realize"
●	Supporting Detail: "In [timeframe], you've made progress in [specific area] - that's real movement forward"
Skills Inventory
●	When: "I don't know anything about money" but demonstrates knowledge
●	User Input Example: "I don't understand money at all, but I know I should pay off my high-interest credit card before putting money in a low-yield savings account"
●	Screen Display: "You know more about money than you're giving yourself credit for"
●	Supporting Detail: "You just demonstrated solid financial reasoning - that knowledge came from somewhere"
Capability Reminder
●	When: "I can't handle money" but evidence shows they can
●	User Input Example: "I can't handle money at all" + never missed a rent payment, utilities always on, feeds family of 4 on $300/month
●	Screen Display: "You're managing your money more successfully than you think"
●	Supporting Detail: "Looking at [specific examples], you're handling financial responsibilities that require real capability"
Strength Reflection
●	When: Focus only on problems, ignore strengths
●	User Input Example: "Everything is falling apart financially. My car needs repairs, my credit card is maxed out, and I have no emergency fund" + user has stable job, always makes minimum payments, and is actively seeking solutions
●	Screen Display: "You're focusing on challenges but missing your strengths"
●	Supporting Detail: "While dealing with [challenges], you're also [specific positive behaviors] - that balance matters"
________________________________________

Family Pattern Acknowledgement 

Why: Users may describe difficult or dysfunctional family money patterns during intake. If their current Plaid data shows healthier behavior, we can affirm their agency and growth without requiring perfection or long-term habit changes.

How it connects to intake:
-	"My parents always fought about money" → Plaid shows calm, routine bill payments
-	"We never had savings growing up" → Plaid shows regular deposits to savings or cash flow margin
-	"I learned to avoid money" → Plaid shows weekly account reviews or budgeting transactions
-	"I still follow the same bad habits I saw at home" → but Plaid shows deviation in even small ways (e.g. rent paid on time, subscriptions canceled, etc.)

Plaid data needed:
-	Recurring payments (especially utilities, rent, subscriptions)
-	(?) Presence of any savings activity or reduced debt
-	Consistent cash flow patterning or category shifts over time

Examples:
Pattern Break Acknowledger
●	When: User describes inherited chaotic or unstable money habits but shows evidence of consistency or intentionality
●	User Input Example: "We never had any money growing up and everything was unpredictable" + user has consistent bill pay and automated savings
●	Screen Display: "You're doing things differently than how you were taught"
●	Supporting Detail: "Even having a system in place—like your recurring payments—shows a shift from that past"

Inherited Belief Reframer
●	When: User expresses a belief tied to family scripts (e.g. "Money is dangerous," "People like us don't save")
●	User Input Example: "We were raised to think money was something to be feared" + Plaid shows user has built an emergency fund
●	Screen Display: "That belief came from somewhere—but you're making new choices now"
●	Supporting Detail: "Your savings behavior shows you're building a different kind of relationship with money"

Small Shift Spotlight
●	When: User claims they've repeated family money patterns, but Plaid shows even partial divergence
●	User Input Example: "I'm just like my dad—I spend without thinking" + Plaid shows user canceled multiple subscriptions last month
●	Screen Display: "Even a small change counts when you're breaking generational habits"
●	Supporting Detail: "Canceling those subscriptions is a step they never took—you're already shifting things"

Cycle Interrupt Recognizer
●	When: User mentions family debt/stress cycles but has begun to reduce or manage differently
●	User Input Example: "My family always lived on credit" + user's credit card balance has dropped for 3 months straight
●	Screen Display: "You're interrupting a pattern that took years to form"
●	Supporting Detail: "That drop in debt might feel small—but it's a big shift from what you saw growing up"

Legacy Rebuilder
●	When: User expresses a desire to create a different financial legacy than their upbringing
●	User Input Example: "I want my kids to have more stability than I did" + Plaid shows emergency fund contributions or regular childcare expenses paid
●	Screen Display: "You're already laying the foundation for something new"
●	Supporting Detail: "Taking care of [specific expense] shows the kind of foundation you're building for the next generation"

________________________________________

Intake Question Relation

1. "When bills are due, how often do you pay them at the last minute or late?"
Relevant Insights:
-	Reality vs. Perception Gap → If user says "often," but Plaid shows most bills paid on time
-	Wins Amplifier → Even if not perfect, highlight success in making payments under pressure
Example Insight:
-	"Even when it's hard, you've still made those payments. That's something to be proud of."

2. "How often do you hold back from sharing financial worries with others?"
Relevant Insights:
-	Shame Language Detector → Signals money secrecy, fear of judgment → use gentle reframing
-	Wins Amplifier → If user later demonstrates vulnerability or self-reflection in app
Example Insight:
-	"Opening up about money is tough, but being here shows you're already starting to change that story."

3. "How often do you feel bad spending money on yourself, even for things you need?"
Relevant Insights:
-	Shame Language Detector → Normalize self-investment
-	Reality vs. Perception Gap → If spending is reasonable and responsible
-	Wins Amplifier → Celebrate intentionality or balance in self-spending
Example Insight:
-	"You took care of yourself this week. That's not a failure. It's a kind of strength."

4. "What are some of your dreams or goals when it comes to money?"
Relevant Insights:
-	Wins Amplifier → Validate any progress, however small, toward that vision
-	Reality vs. Perception Gap → Provide gentle timelines or progress notes (if data supports)
Example Insight:
-	"That $50 you saved this month is a quiet step toward that dream you told us about."

5. "As you grew up, how did your parents talk about money?"
Relevant Insights:
-	Shame Language Detector → Especially if answers reflect inherited fear, guilt, deprivation
-	Wins Amplifier → When user acts differently from family patterns (resilience)
-	Family Pattern Acknowledgement → Supports identifying divergence from inherited beliefs
Example Insight:
-	"You're not just surviving those messages. You're choosing your own approach now."

6. "How often do you find yourself measuring success by what people earn or own?"
Relevant Insights:
-	Shame Language Detector → Intervene in comparison spiral
-	Reality vs. Perception Gap → Gently highlight how the user is doing well in their own lane
Example Insight:
-	"Success isn't a race. You're growing in a way that fits your life."

7. "If you shared one childhood story about money with us, what would it be?"
Relevant Insights:
-	Shame Language Detector → Many stories include emotional pain, guilt, fear
-	Wins Amplifier → Point to strengths drawn from early experience
-	Family Pattern Acknowledgement → Connect memory to current transformation/habits, even if partial
Example Insight:
-	That experience shaped you—and the way you're showing up now speaks to your strength."

________________________________________
Trigger Words/Phrases to Keep Track Of:

Wins Amplifier
Tracked when users downplay strengths or describe effortful behavior as "nothing."
-	"It's not a lot but…"
-	"I guess that's something"
-	"I'm just trying"
-	"Barely managing"
-	"I didn't do enough"
-	"I don't know if it counts"
-	"Not sure if that helps"
-	"I probably should've done more"
-	"It's just a small thing"
-	"I wish I'd saved more"
-	"I'm scraping by"
-	"Lucky this time"

Shame Language Detector
Tracked when users blame, criticize, or pathologize themselves.
-	"I'm terrible with money"
-	"I should know better"
-	"I always mess this up"
-	"I'll never figure this out"
-	"I'm so bad at adulting"
-	"Why can't I get it right?"
-	"I feel guilty spending"
-	"It's embarrassing"
-	"I'm ashamed"
-	"I hide this from people"
-	"Other people have it together"
-	"I don't deserve [x]
-	"I don't want to look stupid"
-	"I don't tell anyone"
-	"I hate looking at my account"
-	"I suck at saving"

Reality vs. Perception Gap
Tracked when there's negative self-perception that may not align with data.
-	"I can't save"
-	"I always pay late"
-	"I'm never going to be financially stable"
-	"I'm not making any progress"
-	"I don't even know where my money goes"
-	"I'm bad at tracking things"
-	"I feel like I'm behind"
-	"I have no idea what I'm doing"
-	"I'm a mess with money"
-	"Nothing's improving"
-	"I don't get it"
-	"It's hopeless"

Family Pattern Acknowledgement
Tracked when users reflect on money messages or patterns from their upbringing.
-	"My parents never talked about money"
-	"Money was always tight"
-	"We grew up struggling"
-	"I was taught to…"
-	"In my family, we…"
-	"My parents always fought about money"
-	"We never had savings"
-	"That's just how I was raised"
-	"We lived paycheck to paycheck"
-	"I still do what I saw growing up"
-	"I didn't learn good habits"
-	"They said money was evil/selfish/etc."
-	"I wasn't allowed to ask for things"
-	"I copied what my mom/dad did"
-	"They never planned for anything"
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Get access_token from request body (like plaid-sync-transactions)
    const { access_token, months_back = 12 } = await req.json();
    if (!access_token) {
      return new Response(JSON.stringify({ error: 'Missing access_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Intake responses
    const { data: intakeResponses } = await supabaseClient
      .from('intake_responses')
      .select('question_text, answer, created_at')
      .eq('user_id', user.id);

    // 4. Chat history
    const { data: chatHistory } = await supabaseClient
      .from('chat_messages')
      .select('content, role, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // 5. Fetch Plaid transactions (same logic as plaid-sync-transactions)
    let allTransactions: any[] = [];
    let cursor = '';
    let hasMore = true;
    let requestCount = 0;
    let retryCount = 0;
    const maxRetries = 3;

    while (hasMore && requestCount < 10) {
      requestCount++;
      const syncRes = await fetch(`${PLAID_BASE_URL}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token,
          cursor: cursor,
          options: { include_personal_finance_category: true }
        })
      });
      
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        if (syncData.error_code === 'PRODUCT_NOT_READY' && retryCount < maxRetries) {
          retryCount++;
          const waitTime = Math.min(2000 * retryCount, 10000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          requestCount--;
          continue;
        }
        break;
      }

      if (syncData.added && syncData.added.length > 0) {
        allTransactions = allTransactions.concat(syncData.added);
      }
      cursor = syncData.next_cursor;
      hasMore = syncData.has_more;
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Filter by date range after sync
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months_back, now.getDate()).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);
    const plaidData = allTransactions.filter(txn => txn.date >= startDate && txn.date <= endDate);

    // 6. Build prompt
    const prompt = `
You are a financial wellness AI. Your job is to generate four personalized insight cards for a user, each corresponding to one of these insights:
1. Wins-amplifier
2. Shame Language Detector
3. Reality vs. Perception Gap
4. Family Pattern Acknowledgement

Each card should:
- Be concise (1-2 sentences headline, 1-2 sentences supporting detail)
- Be empathetic, trauma-informed, and actionable
- Reference the user's real intake answers, chat history, and Plaid data

--- INSIGHT DEFINITIONS ---
${INSIGHT_DEFINITIONS}

--- USER INTAKE RESPONSES ---
${JSON.stringify(intakeResponses, null, 2)}

--- USER CHAT HISTORY (most recent first) ---
${JSON.stringify(chatHistory, null, 2)}

--- USER PLAID DATA (transactions, summaries, etc.) ---
${JSON.stringify(plaidData, null, 2)}

--- OUTPUT FORMAT ---
Return a JSON object with this shape:
{
  "wins_amplifier": { "headline": "...", "detail": "..." },
  "shame_language_detector": { "headline": "...", "detail": "..." },
  "reality_vs_perception_gap": { "headline": "...", "detail": "..." },
  "family_pattern_acknowledgement": { "headline": "...", "detail": "..." }
}
Do not include any other text.
`;

    // 7. Call Azure OpenAI (using same endpoint pattern as plaid-sync-transactions)
    const aiRes = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful, trauma-informed financial wellness AI.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 900,
        temperature: 0.7
      })
    });
    
    const aiData = await aiRes.json();
    let insights = {};
    try {
      insights = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
    } catch {
      insights = {
        wins_amplifier: { headline: "You're managing your money", detail: "Keep going with your financial journey." },
        shame_language_detector: { headline: "Be kind to yourself", detail: "Money management is a learning process." },
        reality_vs_perception_gap: { headline: "You're doing better than you think", detail: "Your actions show financial awareness." },
        family_pattern_acknowledgement: { headline: "You're creating your own path", detail: "Your choices reflect your values." }
      };
    }

    return new Response(JSON.stringify({ insights }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 
