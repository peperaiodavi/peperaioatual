# Code Citations

## License: GPL_3_0
https://github.com/pa4080/game-hub/tree/e82934d9e977dd95dfecc5a6a634381f36c57dfe/components/ui/button.tsx

```
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : "button";
      return (
        <Comp
          ref={ref}
```

