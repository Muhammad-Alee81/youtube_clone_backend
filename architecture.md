// ================= YouTube Comments Architecture =================

/*
01) Jab koi user kisi video par pehla comment karta hai to ek naya document create hota hai.
    Ye Original Comment hota hai.
    Is waqt:
        parentComment = null
        replyTo = null

02) Jab koi user Original Comment ka reply karta hai to ek naya document create hota hai.
    Is document mein:
        parentComment = Original Comment ki ID
        replyTo = Jis user ko reply diya ja raha hai uski User ID

03) Agar koi user kisi Reply ka bhi reply karta hai to phir bhi ek naya document create hota hai.
    Lekin:
        parentComment = Hamesha Original Comment ki ID rahegi.
        replyTo = Jis user ko reply diya ja raha hai uski User ID.

04) Isi tarah chahe kitne bhi replies hoon, har reply ka:
        parentComment = Original Comment ki ID hi hogi.
    Sirf replyTo change hota rahega.

Note:
    Har Comment aur Har Reply database mein ek alag document hota hai.
    Kisi document ke andar replies ka array store nahi hota.
*/