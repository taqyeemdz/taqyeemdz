import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SignupSuccessPage() {
  return (
    <Card className="p-8 bg-white shadow-lg max-w-md">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Account Created!</h1>
        <p className="text-muted-foreground">
          Please check your email to confirm your account. Once confirmed, you can log in and set up your business.
        </p>
        <Link href="/login">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Back to Login</Button>
        </Link>
      </div>
    </Card>
  )
}
