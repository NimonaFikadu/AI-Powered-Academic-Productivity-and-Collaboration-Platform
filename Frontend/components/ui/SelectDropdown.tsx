import React from "react";
import Select from "react-select";

type OptionsProps = {
  value: string;
  label: string;
};

type SelectDropdownProps = {
  options: OptionsProps[];
  title: string;
  placeholder: string;
  value?: string;
  onChange?: (val: string) => void;
};

function SelectDropdown({ options, title, placeholder, value, onChange }: SelectDropdownProps) {
  return (
    <div>
      <p className="text-xs text-n400 -mb-2.5 pl-6">
        <span className="bg-white px-1 relative z-10">{title}</span>
      </p>
      <Select
        options={options}
        placeholder={placeholder}
        value={options.find(o => o.value === value) || null}
        onChange={(opt: any) => onChange?.(opt?.value)}
        classNames={{
          control: ({ isFocused }) =>
            `border !border-primaryColor/30 !rounded-xl !bg-transparent py-1 px-5 ${
              isFocused
                ? "border-primaryColor/50 shadow-md"
                : "border-primaryColor/30"
            }`,
          menu: () => "bg-white shadow-lg rounded-lg ",
          option: ({ isFocused, isSelected }) =>
            ` ${
              isSelected
                ? "!bg-primaryColor/20 !text-n700 dark:!text-white"
                : " "
            } ${
              isFocused ? "!bg-primaryColor/20 !text-n700 dark:!text-white" : ""
            } !text-sm`,
          singleValue: () => "!text-n100 dark:!text-white text-xs",
          menuList: () => "p-2 ",
          placeholder: () => "!text-xs",
        }}
        // menuPosition="fixed"
        // menuPlacement="bottom"
      />
    </div>
  );
}

export default SelectDropdown;
