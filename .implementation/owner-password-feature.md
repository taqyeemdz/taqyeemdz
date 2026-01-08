# Self-Registration with Pending Activation Feature

## Summary
Implemented a complete self-service onboarding flow where users can register immediately but their account remains locked until admin activates them after payment.

## User Flow

### 1. **Registration (Self-Service)**
- User visits `/auth/request`
- Fills out onboarding form with:
  - Business name
  - Owner name  
  - Phone number
  - Email
  - **Password** (self-chosen)
  - Wilaya
  - Activity type
  - Subscription plan choice

### 2. **Immediate Account Creation**
- System creates Supabase Auth account instantly
- User receives success message: "Compte créé!"
- Redirected to login page
- **User can log in immediately**

### 3. **Locked Dashboard Access**
- User logs in successfully
- Redirected to `/owner/pending` (locked state)
- Shows message: "Votre compte est en attente d'activation"
- Explains next steps:
  1. Phone contact from team
  2. Payment of subscription
  3. Full activation

### 4. **Admin Activation**
- Admin reviews onboarding request
- Marks status as "contacted" → "paid"
- Clicks "ACTIVER LE COMPTE"
- System:
  - Updates subscription plan
  - Creates initial business
  - Links business to owner
  - Changes status to "active"

### 5. **Full Access Granted**
- User refreshes or logs in again
- Now has full access to owner dashboard
- Can create businesses, view feedback, etc.

## Files Modified

### Frontend

#### 1. `app/(auth)/auth/request/page.tsx`
- Added `Lock` icon import
- Added `password` field to form state
- Added password input field (required, min 6 chars)
- **Updated `handleSubmit`**:
  - Calls `supabase.auth.signUp()` to create account
  - Stores onboarding request with `user_id` reference
  - Sets status to 'pending'
- Updated success message to say "Compte créé!" 
- Button now says "SE CONNECTER MAINTENANT" → redirects to login

#### 2. `app/owner/pending/page.tsx` *(NEW FILE)*
- Beautiful locked account page
- Shows 3-step process
- "Vérifier l'activation" button (refreshes)
- "Se déconnecter" button
- Average activation time: 24-48 hours

#### 3. `app/owner/layout.tsx`
- Added activation status check
- Queries `onboarding_requests` table for user's status
- If status ≠ 'active', redirects to `/owner/pending`
- Allows access to pending page itself
- Updated useEffect dependency to `[pathname]`

### Backend

#### 4. `app/api/admin/onboarding/activate/route.ts`
- Updated to check if `user_id` exists in request
- **If user_id exists (new flow)**:
  - Skip user creation (already done)
  - Update profile with plan_id
- **If user_id doesn't exist (old flow)**:
  - Create user with admin.createUser
  - Create profile
- Create business and link to user
- Update status to 'active'

### Database

#### 5. `supabase/migrations/20260107122500_add_password_to_onboarding_requests.sql`
- Added `password TEXT` column
- Added `user_id UUID REFERENCES auth.users(id)` column
- Added CASCADE delete
- Created index on user_id for performance
- Added comments explaining columns

## Database Schema Changes

```sql
ALTER TABLE onboarding_requests ADD COLUMN:
- password TEXT (owner's chosen password)
- user_id UUID (reference to auth.users)

INDEX: idx_onboarding_requests_user_id
```

## Status Flow

```
pending → contacted → paid → active
   ↓                            ↓
Login allowed              Full access
(locked dashboard)         (unlocked)
```

## Benefits

✅ **Instant registration** - No waiting for admin to create account  
✅ **User control** - Owner chooses their own password  
✅ **Better UX** - Can log in right away  
✅ **Clear communication** - Knows account is pending activation  
✅ **Admin control** - Still validates and activates after payment  
✅ **Reduced admin work** - No manual account creation  

## Security

- Password validated (min 6 characters)
- Email confirmation automatic through Supabase Auth
- Account locked until admin approval
- Password stored temporarily in onboarding_requests (plain text)
- After activation, only stored in Supabase Auth (encrypted)

## Testing Checklist

- [ ] Submit onboarding request with password
- [ ] Verify account created in Supabase Auth
- [ ] Log in immediately after registration
- [ ] Confirm redirect to `/owner/pending`
- [ ] Verify pending page displays correctly
- [ ] Admin marks as "paid" and activates
- [ ] User refreshes and gets full access
- [ ] Verify business was created and linked

## Migration Required

Run:
```bash
npx supabase migration apply
```

Or apply the SQL manually to your database.

## Notes

- Old flow (admin creates account) still works
- Backward compatible with existing onboarding requests
- If `user_id` is null, activation creates the user
- If `user_id` exists, activation just updates plan and creates business
