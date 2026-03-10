# Code Style Rules — Spacing, Strings & Control Flow

## Context

Formatting rules for spacing, string interpolation, conditions, early returns, and function declarations.

## Spacing (P0)

### Blank line after `}` if code follows

Always add a blank line after a closing brace when there is more code below.

```tsx
// ✅ Correct
if (!user) {
  return null;
}

const displayName = `${user.firstName} ${user.lastName}`;

// ❌ Wrong: no blank line
if (!user) {
  return null;
}
const displayName = `${user.firstName} ${user.lastName}`;
```

Multiple guards:

```tsx
// ✅ Correct
if (!user) {
  return null;
}

if (!user.isActive) {
  return <InactiveMessage />;
}

const displayName = `${user.firstName} ${user.lastName}`;

return <div>{displayName}</div>;
```

### Blank line before final `return` if code exists above

```tsx
// ✅ Correct
function PricingCard({ title, price }: PricingCardProps) {
  const formattedPrice = formatCurrency(price);
  const isExpensive = price > 100;

  return (
    <div>
      <h3>{title}</h3>
      <p>{formattedPrice}</p>
    </div>
  );
}

// ❌ Wrong: no blank line before return
function PricingCard({ title, price }: PricingCardProps) {
  const formattedPrice = formatCurrency(price);
  const isExpensive = price > 100;
  return (
    <div>
      <h3>{title}</h3>
      <p>{formattedPrice}</p>
    </div>
  );
}
```

### Exception: return alone — no blank line needed

```tsx
// ✅ Correct: return is the only statement
function Badge({ label }: { label: string }) {
  return <span>{label}</span>;
}
```

### Combined example

```tsx
function UserProfile({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    return <InactiveMessage />;
  }

  const displayName = `${user.firstName} ${user.lastName}`;
  const hasAvatar = Boolean(user.image);

  function handleToggle() {
    setIsOpen(!isOpen);
  }

  return (
    <Main>
      <h1>{displayName}</h1>
      <Button type="button" onClick={handleToggle}>
        Toggle
      </Button>
    </Main>
  );
}
```

## Strings (P0)

### Template strings: never concatenation

```tsx
// ✅ Correct: template strings
const displayName = `${user.firstName} ${user.lastName}`;
const greeting = `Bonjour ${name} !`;
const url = `${BASE_URL}/tarifs`;
const message = `Il y a ${count} résultat${count > 1 ? "s" : ""}`;

// ❌ Wrong: concatenation with +
const displayName = user.firstName + " " + user.lastName;
const greeting = "Bonjour " + name + " !";
const url = BASE_URL + "/tarifs";
```

## Functions (P0)

### `function` declaration for components and named functions

```tsx
// ✅ Correct
function handleClick(event: MouseEvent<HTMLButtonElement>) {
  console.log(event);
}

function PricingCard({ title }: { title: string }) {
  return <h2>{title}</h2>;
}

// ❌ Wrong: arrow for named functions/components
const handleClick = (event: MouseEvent<HTMLButtonElement>) => { ... };
const PricingCard = ({ title }: { title: string }) => { ... };
```

### Arrow functions: only for inline callbacks

```tsx
// ✅ Correct
items.map((item: Item) => <li key={item.id}>{item.name}</li>);
items.filter((item: Item) => item.isActive);

// ❌ Wrong
items.map(function (item: Item) {
  return <li>{item.name}</li>;
});
```

### Handler naming: `handle{Action}`

```tsx
function handleClick(event: MouseEvent<HTMLButtonElement>) { ... }
function handleChange(event: ChangeEvent<HTMLInputElement>) { ... }
function handleSubmit(event: SubmitEvent<HTMLFormElement>) { ... }
function handleDragOver(event: DragEvent<HTMLDivElement>) { ... }
function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) { ... }
function handleSuccess() { ... }
function handleClose() { ... }
```

## Conditions (P0)

### Always use braces — even single-line

```tsx
// ✅ Correct
if (condition) {
  return;
}

// ❌ Wrong
if (condition) return;
```

### Ternary: only for simple inline JSX

```tsx
// ✅ Correct
{
  isLoading ? "Chargement..." : "Envoyer";
}
{
  hasItems ? <ItemList items={items} /> : <EmptyState />;
}

// ❌ Wrong: nested ternary
{
  a ? b ? <C /> : <D /> : <E />;
}
```

### `&&` in JSX: beware the 0 trap

```tsx
// ❌ Wrong: renders "0"
{
  items.length && <ItemList />;
}

// ✅ Correct
{
  items.length > 0 && <ItemList />;
}
```

## Early Return (P0)

### Order inside a component: hooks → guards → logic → handlers → render

```tsx
function FeaturePage({ data }: FeaturePageProps) {
  // 1. Hooks (always first)
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { ... }, []);

  // 2. Guards (after ALL hooks)
  if (!data) {
    return <EmptyState />;
  }

  // 3. Derived logic
  const itemCount = data.items.length;

  // 4. Handlers
  function handleToggle() {
    setIsOpen(!isOpen);
  }

  // 5. Render
  return (
    <Main>
      <Button type="button" onClick={handleToggle}>Toggle</Button>
    </Main>
  );
}
```

### CRITICAL: never early return between hooks

```tsx
// ❌ WRONG
const [value, setValue] = useState("");
if (!data) { return null; } // breaks Rules of Hooks
useEffect(() => { ... }, []);

// ✅ CORRECT
const [value, setValue] = useState("");
useEffect(() => { ... }, []);
if (!data) { return null; }
```

## Anti-Patterns

```tsx
// ❌ String concatenation
const name = firstName + " " + lastName;

// ❌ No blank line after }
if (!user) { return null; }
const x = 1;

// ❌ No blank line before return
function Comp() {
  const x = 1;
  return <div />;
}

// ❌ Arrow for named function
const handleClick = () => { ... };

// ❌ if without braces
if (cond) return;

// ❌ Nested ternary
{a ? b ? <C /> : <D /> : <E />}

// ❌ 0 trap
{items.length && <List />}

// ❌ Early return between hooks
```
