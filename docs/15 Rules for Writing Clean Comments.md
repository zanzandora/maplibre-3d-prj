---
up:
related:
created: 2026-03-17
in:
---
[[ReadItLater]] [[Article]]

# [15 Rules for Writing Clean Comments](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae)

Comments in code have been there since the beginning of programming. But in today’s world, do we need them? Some would argue that we shouldn’t have comments in our code at all.

Well, it’s true. Code should be self-documenting. But still, there are some instances when we need to add comments. About this Uncle Bob says,

> “Comments are an unfortunate necessity, not great achievements.”

Today, we’ll look at some rules to follow and the common pitfalls to avoid while programming.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#1-multiline-comment-vs-singleline-comment)1. Multiline Comment vs. Single-Line Comment

Whenever possible, try to write long comments as multiline comments.

The following comment is bad:  

```
// This is a long comment 
// Which is written as multiple single line comment.
// Always remember it's bad
```

Enter fullscreen mode Exit fullscreen mode


Instead, do this:  

```
/*
  This is also another comment which is long
  but this comment is written as a multi-line comment
*/
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#2-nonlocal-comment)2\. Nonlocal Comment

Here’s an example of bad comment. The default time out is `5000`, but it doesn’t specify where this value was set.  

```
// if timeout is not set then it defaults to 5000

int timeout = 2000;
```

Enter fullscreen mode Exit fullscreen mode

Never comment about some code that’s not present. Instead, try to provide some context.  

```
// if timeout is not set then it defaults to 5000 which is defined in proerties file

int timeout = 2000;
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#3-favor-long-names-over-an-explanatory-comment)3\. Favor Long Names Over an Explanatory Comment

Sometimes, we try to avoid writing long names and explain them in the comments.  

```
// it calculates the dining set 
// with the sum of table and chairs

dset = tbl + chr 
```

Enter fullscreen mode Exit fullscreen mode

Instead, write long explanatory names, if needed:  

```
dining_set = number_of_tables + number_of_chairs;
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#4-never-ever-ever-comment-out-code)4\. Never, Ever, Ever Comment Out Code!

This is the ugliest practice of all. We sometimes comment out code, thinking we (or someone else) might need that piece of code later.  

```
// if(something){
//    doSomething()
// }
```

Enter fullscreen mode Exit fullscreen mode

We have the version-control system for a reason. Use that.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#5-lying-comment)5\. Lying Comment

Don’t write a comment that doesn’t tell the whole truth.  

```
someFunction(n) {
  ... Some Other Code

  // We don't divide by 0 in order to stop crashes.
  return 1 / n

}
```

Enter fullscreen mode Exit fullscreen mode

Here we’re saying that we’re not dividing by `0`, but where did we ensure that? Maybe we never supply `0` as a value of `n`, but that’s not understandable from this function.

So never comment on something that’s confusing — or maybe a lie!

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#6-explain-in-code-not-in-comments)6\. Explain in Code, Not in Comments

No comment can compensate for a bad piece of code. Don’t comment on some logic.  

```
// checks if employee is eligible for bonus
if(employee.salary > 20000){

}
```

Enter fullscreen mode Exit fullscreen mode

Instead, extract out the logic into a separate, meaningful function.  

```
if(employee.isEligibleForBonus(salary)){

}
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#7-dont-make-comments-harder-than-the-code)7\. Don’t Make Comments Harder Than the Code

Never comment something harder than the code itself. Like the following one:  

```
// this is a utility function that provides us the proper validation 
// for date and time and check the logic

boolean checkIfDateIsValid()
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#8-never-comment-the-obvious)8\. Never Comment the Obvious

Some comments are so obvious that it’s ridiculous to comment them out.  

```
try{
    doSomething()
}catch{
   // exception caught
}
```

Enter fullscreen mode Exit fullscreen mode

Obviously, inside the `catch` block, we catch an exception. There’s no need to point that out.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#9-avoid-todo-comments)9\. Avoid To-Do Comments

Try to avoid TODO comments as much as possible. Because history shows we almost never go back to do that thing later. So try to avoid TODO comments as much as possible.  

```
// TODO clean this later!
// Need to extract into smaller functions

someFunction(){
  // do stuff
}
```

Enter fullscreen mode Exit fullscreen mode

You never do the things on your to-do list, anyway.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#10-stupid-comments)10\. Stupid Comments

Here are some examples of absolutely stupid comments. I guess I don’t need to explain why.  

```
/** The Name */
private String name;

/** The Age  */
private String age;
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#11-dont-yell)11\. Don’t Yell

Don’t yell in comments. If you yell unnecessary things, your other comments can become less important  

```

//------------- YOU MUST SEE THIS COMMENT ------------

someFunction(){
  // do stuff
}
```

Enter fullscreen mode Exit fullscreen mode

No need to yell. Keep it simple.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#12-blaming-comments)12\. Blaming Comments

Some codebases have a rule that every developer should keep their name at the top of the file so people can find out later who did what.  

```

/** Added By Faisal */

someFunction(){
  // do stuff
}
```

Enter fullscreen mode Exit fullscreen mode

It may have made sense 30-40 years ago, but in our current age of version control, we don’t need this anymore. So don’t do that.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#13-comments-should-explain-why-not-how)13\. Comments Should Explain Why, Not How

The following is an example of bad commenting that tries to explain the procedure.  

```

# convert to cents
a = x * 100

# avg cents per customer 
avg = a / n

# add to list
avgs < avg
t += 1
```

Enter fullscreen mode Exit fullscreen mode

But the same code can be rewritten as follows:  

```
total_cents = total * 100
average_per_customer = total_cents / customer_count

track_average(average_per_customer)
```

Enter fullscreen mode Exit fullscreen mode

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#14-documentation-comments)14\. Documentation Comments

Today’s modern languages give us some awesome tools with which we can generate HTML documentation from comments. This sometimes allures developers to write bad documentation comments.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#15-dont-comment)15\. Don’t Comment

The most important rule of commenting is to avoid it in the first place.

Make the code speak for itself.

Try to avoid commenting on code as much as possible. Following this rule can lead you to a cleaner codebase that you can be proud of.

## [](https://dev.to/mohammadfaisal/15-rules-for-writing-clean-comments-2dae#conclusion)Conclusion

Thank you for reading this far. I hope you found something useful in this article.

Have a nice day!

**Get in touch with me via [LinkedIn](https://www.linkedin.com/in/56faisal/) or my [Personal Website](https://www.mdfaisal.com/).**